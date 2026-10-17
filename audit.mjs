// AUDIT responsif landing Yersolid — ukur masalah nyata, bukan kesan.
// Output: JSON + screenshot per breakpoint.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const URL = 'http://127.0.0.1:8099/';
const SIZES = [
  { name: 'hp-320',  w: 320,  h: 640 },   // HP kecil (iPhone SE lama)
  { name: 'hp-390',  w: 390,  h: 844 },   // iPhone 14/15
  { name: 'hp-430',  w: 430,  h: 932 },   // iPhone Pro Max
  { name: 'tab-768', w: 768,  h: 1024 },  // iPad portrait
  { name: 'tab-1024',w: 1024, h: 768 },   // iPad landscape
  { name: 'lap-1280',w: 1280, h: 800 },   // laptop
  { name: 'lap-1440',w: 1440, h: 900 },   // laptop besar
  { name: 'desk-1920',w:1920, h: 1080 },  // desktop
];

fs.mkdirSync('qa/audit', { recursive: true });
const out = [];

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const s of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 2,
    isMobile: s.w < 768,
    hasTouch: s.w < 768,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 120)));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  // ---- ukur ----
  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflowX = doc.scrollWidth - doc.clientWidth;

    // elemen yang keluar viewport horizontal
    const bleeding = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > doc.clientWidth + 2 || r.left < -2) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return;
        bleeding.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 45),
          left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width),
        });
      }
    });

    // target sentuh < 44px (standar aksesibilitas)
    const smallTaps = [];
    document.querySelectorAll('a, button, input, select, textarea, summary').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.height < 40 || r.width < 40) {
        smallTaps.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 28),
          w: Math.round(r.width), h: Math.round(r.height),
        });
      }
    });

    // ukuran font terkecil
    let minFont = 99, minFontSel = '';
    document.querySelectorAll('p, li, span, a, small, td, label').forEach(el => {
      const t = (el.textContent || '').trim();
      if (t.length < 4) return;
      const fs2 = parseFloat(getComputedStyle(el).fontSize);
      if (fs2 > 0 && fs2 < minFont) { minFont = fs2; minFontSel = el.tagName.toLowerCase() + '.' + (el.className || '').toString().slice(0, 30); }
    });

    // heading wrap aneh: heading lebih tinggi dari 3x line-height
    const badHeadings = [];
    document.querySelectorAll('h1,h2,h3').forEach(el => {
      const r = el.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 1;
      const fs2 = parseFloat(getComputedStyle(el).fontSize);
      const lines = Math.round(r.height / (isNaN(lh) ? fs2 * 1.3 : lh));
      if (lines > 4) badHeadings.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 40), lines });
    });

    // grid yang seharusnya stack di HP tapi masih multi-kolom
    const grids = [];
    document.querySelectorAll('[class*="grid"], .cards, .tiers, .pricing, .faq').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display.includes('grid')) {
        grids.push({ cls: (el.className || '').toString().slice(0, 40), cols: cs.gridTemplateColumns.split(' ').length });
      }
    });

    return {
      overflowX,
      docH: doc.scrollHeight,
      bleeding: bleeding.slice(0, 12),
      bleedingCount: bleeding.length,
      smallTapsCount: smallTaps.length,
      smallTaps: smallTaps.slice(0, 8),
      minFont, minFontSel,
      badHeadings,
      grids,
      has3d: document.documentElement.classList.contains('has-3d'),
      no3d: document.documentElement.classList.contains('no-3d'),
      nav: !!document.querySelector('nav'),
    };
  });

  await page.screenshot({ path: `qa/audit/${s.name}.png`, fullPage: true });

  out.push({ size: s.name, viewport: `${s.w}x${s.h}`, ...m, consoleErrors: errs });
  await ctx.close();
}

await browser.close();
fs.writeFileSync('qa/audit/report.json', JSON.stringify(out, null, 2));

// ringkas
console.log('SIZE        OVERFLOW  BLEED  TAP<40  MINFONT  HAS3D  ERRS');
for (const r of out) {
  console.log(
    r.size.padEnd(11),
    String(r.overflowX).padEnd(9),
    String(r.bleedingCount).padEnd(6),
    String(r.smallTapsCount).padEnd(7),
    String(r.minFont).padEnd(8),
    String(r.has3d).padEnd(6),
    r.consoleErrors.length
  );
}
