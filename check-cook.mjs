// Tangkap panggung masak pada tiap tahap untuk membuktikan animasinya berjalan.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
fs.mkdirSync('qa/cook', { recursive: true });

await p.click('#pos-pay');
await p.waitForTimeout(400);
await p.locator('#dapur').scrollIntoViewIfNeeded();
await p.waitForTimeout(800);

const shot = async (name) => {
  await p.locator('.cook-stage').screenshot({ path: `qa/cook/${name}.png` });
};

// 1. masuk
await p.evaluate(() => { window.YT_STORY.advance('masuk'); });
await p.waitForTimeout(400);
await shot('1-masuk');

// 2. masak (uap harus hidup)
await p.evaluate(() => { window.YT_STORY.advance('masak'); });
await p.waitForTimeout(2600);
await shot('2-masak');
// draw-call: pastikan canvas benar-benar menggambar
const canvasData = await p.evaluate(() => {
  const c = document.getElementById('steam');
  if (!c) return null;
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let nonZero = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 4) nonZero++;
  return { w: c.width, h: c.height, paintedPixels: nonZero };
});

// 3. siap
await p.evaluate(() => { window.YT_STORY.advance('siap'); });
await p.waitForTimeout(900);
await shot('3-siap');

// 4. jalur terisi?
const rail = await p.evaluate(() =>
  [...document.querySelectorAll('.rail-step')].map((s) => ({
    stage: s.dataset.stage,
    now: s.classList.contains('is-now'),
    done: s.classList.contains('is-done'),
  }))
);

// 5. laporan hero
await p.locator('#laporan').scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
const report = await p.textContent('#report-value');

console.log(JSON.stringify({ canvasData, rail, report, errors: errs.slice(0, 3) }, null, 1));
await b.close();
