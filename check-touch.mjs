// Ukur target sentuh nyata di mobile + deteksi overflow horizontal
import { chromium } from 'playwright-core';

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const out = [];

for (const w of [320, 360, 390, 430]) {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: 1 });
  await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  await p.waitForTimeout(150);

  const r = await p.evaluate(() => {
    const small = [];
    document.querySelectorAll('a, button, summary').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) return;
      if (b.height < 44 || b.width < 24) {
        small.push({
          t: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 26),
          cls: (el.className || '').toString().slice(0, 24),
          w: Math.round(b.width),
          h: Math.round(b.height),
        });
      }
    });
    return {
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      small: small.slice(0, 12),
    };
  });
  out.push({ w, ...r });
  await p.close();
}

console.log(JSON.stringify(out, null, 1));
await b.close();
