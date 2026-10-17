// Screenshot dengan alur aktif: kirim pesanan lalu tangkap dapur & laporan.
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const W = Number(process.argv[2] || 1440);
const tag = W >= 1200 ? 'desktop' : W >= 800 ? 'tablet' : 'mobile';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: W, height: W >= 1200 ? 900 : 844 } });
await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
fs.mkdirSync('qa/live', { recursive: true });

// bikin 2 pesanan
await p.locator('#pos-menu .pos-item').first().click();
await p.locator('#pos-menu .pos-item').nth(1).click();
await p.click('#pos-pay');
await p.waitForTimeout(700);
await p.evaluate(() => document.getElementById('pos-menu').scrollIntoView());
await p.waitForTimeout(400);
await p.locator('#pos-menu .pos-item').nth(3).click();
await p.click('#pos-pay');
await p.waitForTimeout(600);

// dapur: tunggu satu masuk tahap masak
await p.locator('#dapur').scrollIntoViewIfNeeded();
await p.waitForTimeout(2600);
await p.screenshot({ path: `qa/live/${tag}-dapur.png` });

// kasir
await p.locator('#pos-menu').scrollIntoViewIfNeeded();
await p.waitForTimeout(500);
await p.screenshot({ path: `qa/live/${tag}-kasir.png` });

// laporan setelah ada yang lunas
await p.waitForTimeout(4500);
const serve = await p.locator('.kds-serve').count();
if (serve) {
  await p.locator('.kds-serve').first().click();
  await p.waitForTimeout(800);
}
await p.locator('#laporan').scrollIntoViewIfNeeded();
await p.waitForTimeout(1100);
await p.screenshot({ path: `qa/live/${tag}-laporan.png` });

console.log('ok', tag, 'serve buttons:', serve);
await b.close();
