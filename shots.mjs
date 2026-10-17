// Tangkap screenshot per bagian untuk penilaian visual.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const W = Number(process.argv[2] || 1440);
const tag = W >= 1200 ? 'desktop' : W >= 700 ? 'tablet' : 'mobile';

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);

fs.mkdirSync('qa/sections', { recursive: true });

// kirim pesanan supaya dapur & laporan terisi
await p.click('#pos-pay').catch(() => {});
await p.waitForTimeout(300);
// tahan di tahap 'masuk' supaya badge "baru" terlihat pada tangkapan
await p.evaluate(() => { if (window.YT_STORY) window.YT_STORY.advance = () => {}; });

for (const id of ['dapur', 'stok', 'reservasi', 'laporan', 'bukti', 'harga', 'cara']) {
  const el = p.locator('#' + id);
  if (!(await el.count())) continue;
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(700);
  await el.screenshot({ path: `qa/sections/${tag}-${id}.png` }).catch(() => {});
}

// gambar penuh
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
await p.screenshot({ path: `qa/sections/${tag}-full.png`, fullPage: true });

console.log('selesai: qa/sections/');
await b.close();
