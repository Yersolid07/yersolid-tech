// Regresi: hal-hal yang pernah rusak dan tidak boleh rusak lagi.
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://127.0.0.1:8099/';
const out = [];
const t = (n, ok, d = '') => out.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  [' + d + ']' : ''}`);

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 100)));
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);

// 1. SETIAP <script> YANG ADA DI DISK HARUS DIMUAT
//    (site.js pernah hilang -> hamburger + POS mati total)
const scripts = await p.evaluate(() => [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')));
t('site.js dimuat', scripts.some((s) => s.includes('site.js')), `${scripts.length} skrip`);

// 2. HAMBURGER MEMBUKA DRAWER
const nav = await p.evaluate(async () => {
  const tg = document.querySelector('.nav-toggle');
  tg.click();
  await new Promise((r) => setTimeout(r, 400));
  const d = document.getElementById('nav-drawer');
  const ok = tg.getAttribute('aria-expanded') === 'true' && d.getBoundingClientRect().height > 100;
  tg.click();
  return ok;
});
t('hamburger membuka drawer', nav);

// 3. TOAST KOSONG TIDAK BOLEH TAMPIL (dulu = "kotak hitam")
const toast = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.kds-toast')];
  return els.every((el) => {
    const cs = getComputedStyle(el);
    return !el.classList.contains('on') ? (cs.visibility === 'hidden' || cs.opacity === '0') : true;
  });
});
t('toast kosong tersembunyi', toast);

// 4. SEMUA JANGKAR ADA TUJUANNYA
const anchors = await p.evaluate(() => {
  const bad = [];
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (id && !document.getElementById(id)) bad.push(a.getAttribute('href'));
  });
  return [...new Set(bad)];
});
t('jangkar tidak ada yang rusak', anchors.length === 0, anchors.join(','));

// 5. POS: menambah item mengubah jumlah & total, tanpa "undefined"
const pos = await p.evaluate(async () => {
  const items = [...document.querySelectorAll('.pos-item')];
  if (items.length < 2) return { ok: false, why: 'menu kurang' };
  items[0].click();
  await new Promise((r) => setTimeout(r, 250));
  items[1].click();
  await new Promise((r) => setTimeout(r, 350));
  const count = document.getElementById('pos-count').textContent;
  const total = document.getElementById('pos-total').textContent;
  const hint = document.getElementById('pos-hint').textContent;
  return {
    ok: count === '2 item' && /Rp\s?45\.000/.test(total) && !/undefined/.test(hint),
    count: count, total: total, hint: hint,
  };
});
t('POS: 2 item -> Rp 45.000', pos.ok, `${pos.count} ${pos.total}`);

// 6. POS: kirim -> tiket masuk board
const kirim = await p.evaluate(async () => {
  const before = document.querySelectorAll('.kds-ticket').length;
  document.getElementById('pos-pay').click();
  await new Promise((r) => setTimeout(r, 900));
  return { before, after: document.querySelectorAll('.kds-ticket').length };
});
t('kirim pesanan -> tiket di board', kirim.after > kirim.before, `${kirim.before} -> ${kirim.after}`);

// 7. RESERVASI: mengetuk slot mengubah WARNA (dulu berubah state tapi tampak mati)
const resv = await p.evaluate(async () => {
  const s = document.querySelector('.resv-slot[data-state="free"]');
  if (!s) return { ok: false, why: 'tidak ada slot' };
  const before = getComputedStyle(s).backgroundColor;
  s.click();
  await new Promise((r) => setTimeout(r, 700)); // biarkan transisi selesai
  const after = getComputedStyle(s).backgroundColor;
  return { ok: before !== after && s.dataset.state === 'picked', before, after };
});
t('reservasi: pilihan terlihat', resv.ok, `${resv.before} -> ${resv.after}`);

// 8. FAQ TERBUKA
const faq = await p.evaluate(async () => {
  const d = document.querySelector('details.faq-item');
  if (!d) return false;
  d.querySelector('summary').click();
  await new Promise((r) => setTimeout(r, 250));
  return d.open === true;
});
t('FAQ bisa dibuka', faq);

// 9. TIDAK ADA TEKS BOCOR
const leaks = await p.evaluate(() => {
  const pats = [/undefined/i, /NaN/, /\[object/i, /lorem/i, /TODO/i];
  const found = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (el.children.length) return;
    const tx = (el.textContent || '').trim();
    if (tx && pats.some((p) => p.test(tx))) found.push(tx.slice(0, 30));
  });
  return [...new Set(found)].slice(0, 4);
});
t('tidak ada teks bocor', leaks.length === 0, leaks.join(' | '));

// 10. NOL ERROR KONSOL
t('nol error JS', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(out.join('\n'));
const fails = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\nRESULT: ${out.length - fails}/${out.length} PASS`);
await b.close();
process.exit(fails ? 1 : 0);
