// Audit landing Next.js: responsive 7 ukuran + interaksi nyata.
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://127.0.0.1:3200/';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const gagal = [];
const ok = (n, kondisi, detail = '') => {
  if (!kondisi) gagal.push(`${n} ${detail}`);
  console.log(`${kondisi ? 'OK  ' : 'FAIL'} ${n}${detail ? '  [' + detail + ']' : ''}`);
};

console.log('===== RESPONSIVE =====');
for (const [nama, W, H, mobile] of [
  ['hp-kecil', 320, 568, true],
  ['hp', 390, 844, true],
  ['hp-besar', 430, 932, true],
  ['tablet', 768, 1024, true],
  ['laptop', 1280, 800, false],
  ['laptop-besar', 1440, 900, false],
  ['lebar', 1920, 1080, false],
]) {
  const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 90)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 90)));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);

  const r = await p.evaluate(() => {
    const vw = window.innerWidth;
    const over = [...document.querySelectorAll('body *')].filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.position === 'fixed') return false;
      const b = el.getBoundingClientRect();
      return b.width > 1 && (b.right > vw + 2 || b.left < -2);
    }).length;

    const kecil = [...document.querySelectorAll('p,li,span,dt,dd,a,button,b,small')].filter((el) => {
      if (!el.textContent.trim() || el.children.length) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      return parseFloat(cs.fontSize) < 13;
    }).map((el) => el.tagName.toLowerCase() + ':' + getComputedStyle(el).fontSize);

    const sentuh = [...document.querySelectorAll('a[href],button,summary')].filter((el) => {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (el.closest('footer') && el.getBoundingClientRect().height > 30) return false;
      return b.height < 44 || b.width < 44;
    }).map((el) => (el.textContent.trim().slice(0, 16) || el.tagName) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));

    const hero = document.querySelector('.hero')?.getBoundingClientRect();
    return {
      over, kecil: [...new Set(kecil)].slice(0, 4), sentuh: [...new Set(sentuh)].slice(0, 4),
      heroRasio: hero ? +(hero.height / window.innerHeight).toFixed(2) : null,
      judul: getComputedStyle(document.querySelector('.hero-title')).fontSize,
      docW: document.documentElement.scrollWidth, vw,
    };
  });

  const bersih = r.over === 0 && r.kecil.length === 0 && r.sentuh.length === 0 && errs.length === 0 && r.docW <= r.vw + 1;
  console.log(
    `${nama.padEnd(12)} ${W}x${H}: ${bersih ? 'OK' : 'MASALAH'} | overflow=${r.over} kecil=${r.kecil.length} sentuh=${r.sentuh.length} err=${errs.length} | hero=${r.heroRasio}x judul=${r.judul}`
  );
  if (r.kecil.length) console.log('   teks<13:', r.kecil.join(', '));
  if (r.sentuh.length) console.log('   sentuh<44:', r.sentuh.join(', '));
  if (errs.length) console.log('   error:', errs.slice(0, 2).join(' | '));
  if (!bersih) gagal.push(`${nama}: overflow=${r.over} kecil=${r.kecil.length} sentuh=${r.sentuh.length} err=${errs.length}`);
  await p.close();
}

console.log('\n===== INTERAKSI =====');
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);

// hamburger
await p.getByRole('button', { name: /Buka menu/i }).click();
await p.waitForTimeout(300);
const drawerBuka = await p.locator('#drawer').isVisible();
ok('hamburger membuka drawer', drawerBuka);
await p.getByRole('button', { name: /Tutup menu/i }).click();
await p.waitForTimeout(250);
ok('hamburger menutup drawer', !(await p.locator('#drawer').isVisible()));

// keranjang: tambah 2 menu
await p.getByRole('button', { name: /Tambah Nasi Goreng Roa/i }).click();
await p.waitForTimeout(150);
await p.getByRole('button', { name: /Tambah goroho stick 20/i }).click();
await p.waitForTimeout(250);
const total = await p.locator('#kasir').getByText(/Rp 45\.000/).count();
ok('keranjang: 2 item = Rp 45.000', total > 0);
const tanpaUndefined = (await p.locator('body').innerText()).includes('undefined') === false;
ok('tidak ada teks undefined', tanpaUndefined);

// kirim -> dapur
await p.getByRole('button', { name: /Kirim ke dapur/i }).click();
await p.waitForTimeout(600);
const tiket = await p.locator('#dapur li').filter({ hasText: /^#/ }).count();
ok('kirim pesanan -> tiket di dapur', tiket > 0, `${tiket} tiket`);

// tunggu jadi siap lalu bayar
await p.waitForTimeout(9000);
const tombolBayar = p.getByRole('button', { name: /Terima pembayaran/i });
const adaBayar = (await tombolBayar.count()) > 0;
ok('pesanan sampai tahap siap', adaBayar);
if (adaBayar) {
  await tombolBayar.first().click();
  await p.waitForTimeout(900);
  const lunas = await p.locator('#laporan').getByText(/45\.000/).count();
  ok('bayar -> laporan terisi', lunas > 0);
}

// jangkar
const jangkarRusak = await p.evaluate(() =>
  [...document.querySelectorAll('a[href^="#"]')]
    .map((a) => a.getAttribute('href').slice(1))
    .filter((id) => id && !document.getElementById(id))
);
ok('semua jangkar ada tujuannya', jangkarRusak.length === 0, jangkarRusak.join(','));

// 404
const nf = [];
p.on('response', (r) => r.status() >= 400 && nf.push(r.status() + ' ' + r.url()));
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(600);
ok('tidak ada aset 404', nf.length === 0, nf.slice(0, 2).join(' '));

await b.close();
console.log(`\nRESULT: ${gagal.length === 0 ? 'SEMUA LULUS' : gagal.length + ' MASALAH'}`);
if (gagal.length) console.log(gagal.join('\n'));
process.exit(gagal.length ? 1 : 0);
