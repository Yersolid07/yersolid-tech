// Uji aturan interaksi dari referensi pada halaman kita.
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://127.0.0.1:8099/';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(900);

const out = [];
const t = (n, ok, d = '') => out.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  [' + d + ']' : ''}`);

// 1. terkunci sebelum ada pesanan
const locked = await p.evaluate(() => {
  const el = document.getElementById('dapur-lock');
  return el ? !el.classList.contains('off') : null;
});
t('dapur terkunci sebelum ada pesanan', locked === true, String(locked));

// 2. tombol contoh ada
t('tombol "Pakai contoh pesanan" ada', (await p.locator('#pos-demo').count()) === 1);

// 3. stok tampil & turun
const s0 = await p.evaluate(() => document.querySelector('#pos-menu .pos-stock').textContent);
await p.locator('#pos-menu .pos-item').first().click();
await p.waitForTimeout(250);
const s1 = await p.evaluate(() => document.querySelector('#pos-menu .pos-stock').textContent);
t('stok turun setelah ketuk', s0 !== s1, `${s0} -> ${s1}`);

// 4. kirim -> board terisi + kunci terbuka
await p.click('#pos-pay');
await p.waitForTimeout(900);
const tks = await p.locator('.kds-ticket').count();
t('tiket masuk papan dapur', tks > 0, String(tks));
const unlocked = await p.evaluate(() => document.getElementById('dapur-lock').classList.contains('off'));
t('kunci terbuka', unlocked === true);

// 5. wajan menyala saat dimasak
await p.locator('#dapur').scrollIntoViewIfNeeded();
await p.waitForTimeout(2400);
const cooking = await p.evaluate(() => document.getElementById('wok-card').dataset.cooking);
t('wajan menyala saat memasak', cooking === 'true', cooking);
const wokTitle = await p.textContent('#wok-title');
t('judul wajan menyebut nomor', /#\d+/.test(wokTitle), wokTitle);

// 6. pesanan paralel
await p.locator('#pos-menu').scrollIntoViewIfNeeded();
await p.waitForTimeout(500);
await p.locator('#pos-menu .pos-item').nth(1).click();
await p.click('#pos-pay');
await p.waitForTimeout(800);
const tks2 = await p.locator('.kds-ticket').count();
t('dua pesanan paralel', tks2 > tks, `${tks} -> ${tks2}`);

// 7. stok tidak pernah reset walau pesanan dikirim
const soldNow = await p.evaluate(() => {
  const el = document.querySelector('#rep-stock .rep-stock-row b');
  return el ? el.textContent : '';
});
t('stok di laporan berkurang', /habis|porsi/.test(soldNow), soldNow);

// 8. selesaikan -> laporan terisi
await p.waitForTimeout(4200);
const serveBtns = await p.locator('.kds-serve').count();
if (serveBtns) {
  await p.locator('.kds-serve').first().click();
  await p.waitForTimeout(700);
}
const total = await p.textContent('#rep-total');
t('laporan total terisi', total !== 'Rp 0', total);

// 9. rail menyala
await p.locator('#dapur').scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
const railNow = await p.evaluate(() => document.querySelectorAll('.rail-step.is-now').length);
t('rail menandai tahap aktif', railNow >= 1, String(railNow));

t('nol error konsol', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(out.join('\n'));
const fails = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\nRESULT: ${out.length - fails}/${out.length} PASS`);
await b.close();
process.exit(fails ? 1 : 0);
