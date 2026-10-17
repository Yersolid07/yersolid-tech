// Uji FOCAL MOMENT: tiket terbang saat "Kirim ke dapur".
import { chromium } from 'playwright-core';

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await p.goto('https://saas.yersolid.web.id/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);

const out = [];
const t = (n, ok, d = '') => out.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  [' + d + ']' : ''}`);

// klik kirim, lalu deteksi elemen tiket terbang muncul
await p.click('#pos-pay');

let seen = false;
let seenText = '';
for (let i = 0; i < 30; i++) {
  const el = await p.$('.flying-ticket');
  if (el) {
    seen = true;
    seenText = (await el.textContent()) || '';
    break;
  }
  await p.waitForTimeout(40);
}
t('tiket terbang muncul', seen, seenText);
t('tiket membawa nomor pesanan', /#\d+/.test(seenText), seenText);

// tunggu animasi selesai, pastikan elemen dibersihkan (tidak bocor)
await p.waitForTimeout(1800);
const leftover = await p.$$eval('.flying-ticket', (els) => els.length);
t('tiket terbang dibersihkan setelah animasi', leftover === 0, String(leftover));

// tahap otomatis pindah ke masak saat dapur terlihat
await p.locator('#dapur').scrollIntoViewIfNeeded();
await p.waitForTimeout(1600);
const stage = await p.evaluate(() => window.YT_STORY.stage);
t('tahap pindah otomatis saat sampai dapur', stage === 'masak' || stage === 'siap', stage);

// uap hidup saat masak
const steam = await p.evaluate(() => {
  const c = document.getElementById('steam');
  if (!c) return 0;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 4) n++;
  return n;
});
t('uap menggambar saat masak', steam > 500, String(steam));

t('nol error konsol', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(out.join('\n'));
const fails = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\nRESULT: ${out.length - fails}/${out.length} PASS`);
await b.close();
process.exit(fails ? 1 : 0);
