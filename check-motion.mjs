// Cek: error konsol, GSAP aktif, jumlah elemen bergerak, warna, dan field per band.
import { chromium } from 'playwright-core';

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e)));
p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });

await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);

const info = await p.evaluate(() => {
  const bands = [...document.querySelectorAll('.band, .photo-band, .closing')].map((s) => ({
    id: s.id || s.className,
    bg: getComputedStyle(s).backgroundColor,
  }));
  return {
    gsap: typeof window.gsap !== 'undefined' ? window.gsap.version : null,
    st: typeof window.ScrollTrigger !== 'undefined',
    noMotion: document.documentElement.classList.contains('no-motion'),
    sections: document.querySelectorAll('section').length,
    hasProof: !!document.getElementById('bukti'),
    bands,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  };
});

// hitung elemen yang benar-benar bergerak saat scroll
const moved = await p.evaluate(async () => {
  const before = new Map();
  document.querySelectorAll('.band *, .closing *').forEach((el, i) => {
    const cs = getComputedStyle(el);
    before.set(i, { o: cs.opacity, t: cs.transform });
  });
  let count = 0;
  const nodes = [...document.querySelectorAll('.band *, .closing *')];
  nodes.forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.opacity !== '1' || cs.transform !== 'none') count += 1;
  });
  return { animating: count, total: nodes.length };
});

console.log(JSON.stringify({ ...info, ...moved, errors: errs.slice(0, 6) }, null, 1));
await b.close();
