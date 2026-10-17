// ============================================================
// Suite lengkap halaman Yersolid Tech (versi board + wajan).
// Menggantikan test-func / test-story / test-motion lama yang
// menguji komponen yang sudah tidak ada.
// ============================================================
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

const out = [];
const t = (n, ok, d = '') => out.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  [' + d + ']' : ''}`);

await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(900);

/* ---------- A. memuat ---------- */
t('halaman termuat', (await p.title()).includes('Yersolid'));
t('5 menu tampil', (await p.locator('#pos-menu .pos-item').count()) === 5);
t('ikon menu SVG', (await p.locator('#pos-menu .pos-icon svg').count()) === 5);

/* ---------- B. aturan: stok tidak reset ---------- */
const s0 = await p.textContent('#pos-menu .pos-item >> nth=0 >> .pos-stock');
await p.locator('#pos-menu .pos-item').first().click();
await p.waitForTimeout(220);
const s1 = await p.textContent('#pos-menu .pos-item >> nth=0 >> .pos-stock');
t('stok turun saat diketik', s0 !== s1, `${s0} -> ${s1}`);

/* ---------- C. aturan: terkunci sebelum ada pesanan ---------- */
const lockedBefore = await p.evaluate(() => !document.getElementById('dapur-lock').classList.contains('off'));
t('dapur terkunci sebelum pesanan', lockedBefore);

/* ---------- D. keranjang ---------- */
await p.locator('#pos-menu .pos-item').nth(2).click();
await p.waitForTimeout(200);
const cnt = await p.textContent('#pos-count');
const tot = await p.textContent('#pos-total');
t('keranjang menghitung item', /2 item/.test(cnt), cnt);
t('total benar', /Rp 43\.000/.test(tot), tot);

/* ---------- E. kirim ---------- */
await p.click('#pos-pay');
await p.waitForTimeout(800);
t('tiket masuk papan', (await p.locator('.kds-ticket').count()) >= 1);
t('kunci terbuka', await p.evaluate(() => document.getElementById('dapur-lock').classList.contains('off')));
const railTxt = await p.textContent('#rail-active');
t('rail menyebut nomor pesanan', /#\d+/.test(railTxt), railTxt);

/* ---------- F. wajan hidup ---------- */
await p.locator('#dapur').scrollIntoViewIfNeeded();
await p.waitForTimeout(2400);
t('wajan menyala', (await p.evaluate(() => document.getElementById('wok-card').dataset.cooking)) === 'true');
const wokT = await p.textContent('#wok-title');
t('wajan menyebut pesanan', /#\d+/.test(wokT), wokT);

/* ---------- G. paralel ---------- */
await p.locator('#pos-menu').scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await p.locator('#pos-menu .pos-item').nth(3).click();
await p.click('#pos-pay');
await p.waitForTimeout(700);
t('pesanan paralel jalan', (await p.locator('.kds-ticket').count()) >= 2);

/* ---------- H. menu habis tidak bisa diklik ---------- */
const outClick = await p.evaluate(() => {
  const st = window.YT_STORE;
  // habiskan jus (stok 6)
  for (let i = 0; i < 8; i++) st.add('jus');
  return { left: st.left('jus'), disabled: document.querySelector('[data-add="jus"]').getAttribute('aria-disabled') };
});
t('menu habis ditandai', outClick.left === 0 && outClick.disabled === 'true', JSON.stringify(outClick));

/* ---------- I. laporan ---------- */
await p.waitForTimeout(4200);
const serve = await p.locator('.kds-serve').count();
if (serve) {
  await p.locator('.kds-serve').first().click();
  await p.waitForTimeout(900);
}
const repTotal = await p.textContent('#rep-total');
t('laporan total terisi', repTotal !== 'Rp 0', repTotal);
const stockRows = await p.locator('#rep-stock .rep-stock-row').count();
t('stok bahan tampil di laporan', stockRows === 5, String(stockRows));

/* ---------- J. rail menyala ---------- */
await p.locator('#dapur').scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
t('rail menandai tahap', (await p.locator('.rail-step.is-now').count()) >= 1);

/* ---------- K. konsol bersih ---------- */
t('nol error konsol', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(out.join('\n'));
const fails = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\nRESULT: ${out.length - fails}/${out.length} PASS`);
await b.close();
process.exit(fails ? 1 : 0);
