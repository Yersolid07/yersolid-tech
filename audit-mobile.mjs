// Audit menyeluruh di beberapa lebar HP: section mana yang tak tampil.
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'https://saas.yersolid.web.id/';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const W of [360, 390, 414]) {
  const p = await b.newPage({
    viewport: { width: W, height: 780 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e)));
  p.on('console', (m) => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));

  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  const r = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('section, #harga, footer, .band').forEach((el, i) => {
      if (out.some((o) => o.el === el)) return;
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        cls: (el.className || '').toString().slice(0, 30),
        w: Math.round(b.width),
        h: Math.round(b.height),
        top: Math.round(b.top + window.scrollY),
        display: cs.display,
        visibility: cs.visibility,
        opacity: cs.opacity,
        overflowY: cs.overflowY,
        docH: document.documentElement.scrollHeight,
      });
    });
    return out;
  });

  const docH = await p.evaluate(() => document.documentElement.scrollHeight);
  const invisible = r.filter(
    (x) => x.h < 40 || x.display === 'none' || x.visibility === 'hidden' || Number(x.opacity) < 0.2
  );

  console.log(`\n===== ${W}px =====`);
  console.log('tinggi dokumen:', docH);
  console.log('total section terdeteksi:', r.length);
  console.log('section TIDAK tampil / terlalu pendek:');
  invisible.forEach((x) => console.log('   ', JSON.stringify(x)));
  if (!invisible.length) console.log('    (tidak ada)');
  console.log('error konsol:', errs.length ? errs.slice(0, 4) : 'nol');

  // cek section kunci benar-benar terlihat
  for (const sel of ['#laporan', '#harga', '#bukti', 'footer']) {
    const v = await p.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return 'TIDAK ADA di DOM';
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { h: Math.round(r.height), top: Math.round(r.top + window.scrollY), display: cs.display, opacity: cs.opacity };
    }, sel);
    console.log(`  ${sel}:`, JSON.stringify(v));
  }

  await p.close();
}
await b.close();
