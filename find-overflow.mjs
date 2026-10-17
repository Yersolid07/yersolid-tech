// Cari elemen yang meluber horizontal di 390px
import { chromium } from 'playwright-core';

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });

const bad = await p.evaluate(() => {
  document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'));
  const out = [];
  const vw = innerWidth;
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    if (r.right > vw + 1 || r.left < -1) {
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 40),
        left: Math.round(r.left),
        right: Math.round(r.right),
        w: Math.round(r.width),
        txt: (el.textContent || '').trim().slice(0, 30),
      });
    }
  });
  return { vw, out: out.slice(0, 20) };
});

console.log('viewport', bad.vw);
console.log(JSON.stringify(bad.out, null, 1));
await b.close();
