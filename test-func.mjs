// Uji FUNGSI nyata: POS menambah item, total benar, stok turun, tiket masuk KDS,
// reservasi memilih meja, nav mobile membuka.
import { chromium } from 'playwright-core';

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const res = [];
const t = (name, ok, detail = '') => res.push({ name, ok, detail });

const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });

// --- 1. seed order tampil (bukan kosong)
const total0 = await p.textContent('#pos-total');
t('seed order ada', /Rp\s?90\.000/.test(total0 || ''), total0);

// --- 2. stok awal tercatat
const berasAwal = await p.textContent('.inv-row[data-stock="kentang"] [data-qty]');
t('stok kentang awal', berasAwal === '28', berasAwal);

// --- 3. tambah item -> total & stok berubah
await p.click('.pos-item[data-stock="kentang"]');
const total1 = await p.textContent('#pos-total');
const kentangSetelah = await p.textContent('.inv-row[data-stock="kentang"] [data-qty]');
t('total naik +42.000', /Rp\s?108\.000/.test(total1 || ''), total1);
t('stok kentang turun 27', kentangSetelah === '27', kentangSetelah);

// --- 4. klik lagi -> qty bertambah
await p.click('.pos-item[data-stock="kentang"]');
const total2 = await p.textContent('#pos-total');
t('total naik lagi', /Rp\s?126\.000/.test(total2 || ''), total2);

// --- 5. kirim ke dapur -> tiket baru muncul di KDS
const before = await p.locator('#pos-kds .kds-ticket').count();
await p.click('#pos-pay');
await p.waitForTimeout(250);
const after = await p.locator('#pos-kds .kds-ticket').count();
const newest = await p.locator('#pos-kds .kds-ticket').first().textContent();
t('tiket KDS bertambah', after === before + 1, `${before} → ${after}`);
t('tiket berisi #119', /#119/.test(newest || ''), newest);

// --- 6. setelah kirim, keranjang kosong lagi
const total3 = await p.textContent('#pos-total');
t('keranjang reset', /Rp\s?0/.test(total3 || ''), total3);

// --- 7. stok kembali ke angka awal
const kentangReset = await p.textContent('.inv-row[data-stock="kentang"] [data-qty]');
t('stok pulih', kentangReset === '28', kentangReset);

// --- 8. reservasi: pilih meja
await p.click('.resv-slot[data-state="free"]');
const picked = await p.locator('.resv-slot[data-state="picked"]').count();
t('meja terpilih', picked === 1, String(picked));

// --- 9. meja terisi tidak bisa dipilih
await p.click('.resv-slot[data-state="booked"]');
const pickedAfterBooked = await p.locator('.resv-slot[data-state="picked"]').count();
t('meja terisi ditolak', pickedAfterBooked === 1, String(pickedAfterBooked));

// --- 10. FAQ bisa dibuka
await p.click('.faq-item summary');
const open = await p.locator('.faq-item[open]').count();
t('FAQ terbuka', open === 1, String(open));

// --- 11. nav anchor sampai
await p.click('.nav-links a[href="#harga"]');
await p.waitForTimeout(700);
const y = await p.evaluate(() => window.scrollY);
t('anchor harga discroll', y > 500, String(Math.round(y)));

// --- 12. tanpa error konsol
t('nol error konsol', errs.length === 0, errs.slice(0, 3).join(' | '));

// --- 13. gambar benar-benar termuat
const imgs = await p.evaluate(() =>
  [...document.querySelectorAll('.photo-band')].map((e) => {
    const u = getComputedStyle(e).backgroundImage.match(/url\("?([^")]+)/);
    return u ? u[1] : null;
  })
);
const imgOk = [];
for (const u of imgs) {
  if (!u) { imgOk.push(false); continue; }
  const r = await p.request.get(u);
  imgOk.push(r.ok());
}
t('foto band termuat', imgOk.length === 2 && imgOk.every(Boolean), JSON.stringify(imgOk));

await p.close();

// --- 14. mobile: menu buka/tutup
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto('http://127.0.0.1:8099/', { waitUntil: 'networkidle' });
await m.click('.nav-toggle');
await m.waitForTimeout(200);
const drawerOpen = await m.getAttribute('#nav-drawer', 'data-open');
t('drawer mobile buka', drawerOpen === 'true', String(drawerOpen));
await m.click('.nav-drawer a[href="#harga"]');
await m.waitForTimeout(250);
const drawerClosed = await m.getAttribute('#nav-drawer', 'data-open');
t('drawer menutup setelah klik', drawerClosed === 'false', String(drawerClosed));
await m.close();

await b.close();

const fail = res.filter((r) => !r.ok);
console.log(res.map((r) => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  [' + r.detail + ']' : ''}`).join('\n'));
console.log(`\nRESULT: ${res.length - fail.length}/${res.length} PASS`);
process.exit(fail.length ? 1 : 0);
