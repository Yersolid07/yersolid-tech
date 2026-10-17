// Audit tata letak HP: cari elemen sempit, tumpang tindih, teks terpotong.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://127.0.0.1:8099/';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const W of [360, 390]) {
  const p = await b.newPage({
    viewport: { width: W, height: 780 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  const r = await p.evaluate(() => {
    const vw = window.innerWidth;
    const issues = [];
    document.querySelectorAll('body *').forEach((el) => {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || b.height < 4) return;
      const tag = el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0];

      // melewati tepi kanan
      if (b.right > vw + 1) issues.push({ t: tag, why: 'lewat-kanan', by: Math.round(b.right - vw) });
      // elemen sempit yang isinya teks panjang (tergencet)
      if (b.width < 60 && el.children.length === 0 && (el.textContent || '').trim().length > 6) {
        issues.push({ t: tag, why: 'sempit', w: Math.round(b.width), txt: el.textContent.trim().slice(0, 20) });
      }
      // teks terpotong
      if (el.children.length === 0 && cs.overflow === 'hidden' && el.scrollWidth > el.clientWidth + 2) {
        issues.push({ t: tag, why: 'teks-terpotong', sw: el.scrollWidth, cw: el.clientWidth });
      }
    });

    // dedupe
    const seen = new Set();
    const uniq = issues.filter((i) => {
      const k = i.t + i.why;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // tumpang tindih tombol dengan elemen lain
    const btns = [...document.querySelectorAll('a.btn, button')].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.height > 0 && r.width > 0;
    });
    const small = btns.filter((b) => {
      const r = b.getBoundingClientRect();
      return r.height < 44 || r.width < 44;
    }).map((b) => ({
      txt: b.textContent.trim().slice(0, 18),
      w: Math.round(b.getBoundingClientRect().width),
      h: Math.round(b.getBoundingClientRect().height),
    }));

    return { vw, issues: uniq.slice(0, 14), totalIssues: issues.length, small };
  });

  console.log(`\n===== ${W}px =====`);
  console.log('masalah tata letak:', r.totalIssues);
  r.issues.forEach((i) => console.log('  ', JSON.stringify(i)));
  console.log('target sentuh <44px:', r.small.length, JSON.stringify(r.small.slice(0, 6)));
  await p.close();
}
await b.close();
