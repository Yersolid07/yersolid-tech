// Uji ALUR CERITA: kirim pesanan dari kasir, lalu ikuti sampai laporan.
import { chromium } from 'playwright-core';

const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e)));

await p.goto('https://saas.yersolid.web.id/', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);

const out = [];
const t = (name, ok, detail = '') => out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  [' + detail + ']' : ''}`);

// 1. awal: dapur kosong
const emptyVisible = await p.locator('#story-kds-empty').isVisible();
t('dapur kosong di awal', emptyVisible);

// 2. kirim pesanan dari kasir (seed sudah ada 3 item)
const seedTotal = await p.textContent('#pos-total');
await p.click('#pos-pay');
await p.waitForTimeout(400);

const stored = await p.evaluate(() => window.YT_STORY.ticket ? {
  no: window.YT_STORY.ticket.no,
  total: window.YT_STORY.ticket.total,
  items: window.YT_STORY.ticket.items.length,
  stage: window.YT_STORY.stage,
} : null);
t('pesanan tersimpan di story', !!stored, JSON.stringify(stored));
t('total story cocok dengan kasir', stored && ('Rp ' + stored.total.toLocaleString('id-ID')) === seedTotal, `${stored?.total} vs ${seedTotal}`);
t('tahap awal = masuk', stored?.stage === 'masuk', stored?.stage);

// 3. dapur menampilkan pesanan
await p.locator('#dapur').scrollIntoViewIfNeeded();
await p.waitForTimeout(900);
const kdsItems = await p.locator('#story-kds-list .kds-item').count();
t('dapur menampilkan item', kdsItems === stored.items, `${kdsItems} vs ${stored.items}`);

const stageTxt = await p.textContent('#story-stage');
t('label tahap dapur terisi', /#\d+/.test(stageTxt || ''), stageTxt);

// 4. tombol tahap ada & bisa diklik
await p.click('#story-advance');
await p.waitForTimeout(600);
const st2 = await p.evaluate(() => window.YT_STORY.stage);
t('tombol memajukan tahap', st2 !== 'masuk', st2);

// 5. titik langkah menyala
const onDots = await p.locator('.rail-step.is-now').count();
t('titik tahap aktif', onDots === 1, String(onDots));

// 6. laporan ikut bertambah
await p.locator('#laporan').scrollIntoViewIfNeeded();
await p.waitForTimeout(900);
const dayCount = await p.textContent('#story-day-count');
const dayTotal = await p.textContent('#report-value');
t('laporan bertambah transaksi', dayCount !== '0', dayCount);
t('laporan total terisi', dayTotal !== 'Rp 0', dayTotal);

// 7. maju sampai selesai
for (let i = 0; i < 3; i++) {
  await p.click('#story-advance').catch(() => {});
  await p.waitForTimeout(350);
}
const finalStage = await p.evaluate(() => window.YT_STORY.stage);
t('tahap akhir selesai', finalStage === 'selesai', finalStage);

// 8. tombol nonaktif di tahap akhir
const disabled = await p.locator('#story-advance').isDisabled();
t('tombol nonaktif saat selesai', disabled);

// 9. tanpa error
t('nol error konsol', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(out.join('\n'));
const fails = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\nRESULT: ${out.length - fails}/${out.length} PASS`);
await b.close();
process.exit(fails ? 1 : 0);
