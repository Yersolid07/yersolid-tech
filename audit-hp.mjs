// Audit menyeluruh HP: apakah setiap bagian punya isi & aksi yang bisa dipakai.
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://127.0.0.1:8099/';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const out = [];
const t = (n, ok, d = '') => out.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  [' + d + ']' : ''}`);

for (const W of [360, 390, 430]) {
  const p = await b.newPage({
    viewport: { width: W, height: 800 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);

  // board terkunci sampai ada pesanan: jalankan satu lewat tombol contoh
  const demo = p.locator('#pos-demo').first();
  if (await demo.count()) {
    await p.locator('#dapur').scrollIntoViewIfNeeded();
    await p.waitForTimeout(300);
    await demo.click({ force: true }).catch(() => {});
    await p.waitForTimeout(700);
  }

  // gulir penuh supaya semua trigger jalan
  const docH = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < docH; y += 600) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(160);
  }
  await p.waitForTimeout(900);

  const r = await p.evaluate(() => {
    const sec = (id) => document.getElementById(id);
    const op = (el) => (el ? Number(getComputedStyle(el).opacity) : null);
    const h = (el) => (el ? Math.round(el.getBoundingClientRect().height) : 0);
    const txt = (id, n = 60) => (sec(id)?.innerText || '').trim().slice(0, n);

    return {
      // isi tiap bagian
      kasirMenu: document.querySelectorAll('#pos-menu .pos-item').length,
      dapurBoard: document.querySelectorAll('.kds-col').length,
      wokAda: !!document.getElementById('wok-card'),
      laporan: {
        h: h(sec('laporan')),
        op: op(sec('laporan')),
        total: document.getElementById('rep-total')?.textContent,
        stockRows: document.querySelectorAll('#rep-stock .rep-stock-row').length,
      },
      harga: {
        h: h(sec('harga')),
        op: op(sec('harga')),
        cards: document.querySelectorAll('.plan-card').length,
        buttons: document.querySelectorAll('.plan-card .btn').length,
        names: [...document.querySelectorAll('.plan-card h3')].map((e) => e.textContent.trim()),
        prices: [...document.querySelectorAll('.plan-card .plan-price')].map((e) => e.textContent.trim().slice(0, 12)),
      },
      bukti: { h: h(sec('bukti')), op: op(sec('bukti')) },
      reservasi: { h: h(sec('reservasi')), op: op(sec('reservasi')) },
      stok: { h: h(sec('stok')), op: op(sec('stok')) },
      faq: document.querySelectorAll('.faq-item').length,
      // elemen tersembunyi yang seharusnya tampil
      revealTersembunyi: [...document.querySelectorAll('.reveal')].filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length,
      // kecil
      docH: document.documentElement.scrollHeight,
    };
  });

  t(`${W}px: menu kasir tampil`, r.kasirMenu === 5, String(r.kasirMenu));
  t(`${W}px: board dapur 3 kolom`, r.dapurBoard === 3, String(r.dapurBoard));
  t(`${W}px: wajan ada`, r.wokAda);
  t(`${W}px: laporan tampil`, r.laporan.op === 1 && r.laporan.h > 300, `op=${r.laporan.op} h=${r.laporan.h}`);
  t(`${W}px: stok bahan di laporan`, r.laporan.stockRows === 5, String(r.laporan.stockRows));
  t(`${W}px: harga tampil`, r.harga.op === 1 && r.harga.h > 400, `op=${r.harga.op} h=${r.harga.h}`);
  t(`${W}px: 3 kartu paket + tombol`, r.harga.cards === 3 && r.harga.buttons === 3, `kartu=${r.harga.cards} tombol=${r.harga.buttons}`);
  t(`${W}px: harga bernilai`, r.harga.prices.every((x) => /Rp/.test(x)), r.harga.prices.join(' '));
  t(`${W}px: bukti tampil`, r.bukti.op === 1 && r.bukti.h > 200, `op=${r.bukti.op} h=${r.bukti.h}`);
  t(`${W}px: reservasi tampil`, r.reservasi.op === 1 && r.reservasi.h > 200, `op=${r.reservasi.op} h=${r.reservasi.h}`);
  t(`${W}px: stok tampil`, r.stok.op === 1 && r.stok.h > 200, `op=${r.stok.op} h=${r.stok.h}`);
  t(`${W}px: FAQ ada`, r.faq >= 3, String(r.faq));
  t(`${W}px: tidak ada reveal tersembunyi`, r.revealTersembunyi === 0, String(r.revealTersembunyi));

  // tombol beli benar-benar bisa diklik
  await p.locator('#harga').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  const btn = p.locator('.plan-card .btn').first();
  const box = await btn.boundingBox();
  t(`${W}px: tombol paket terlihat`, !!box && box.height >= 44, box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'kosong');

  t(`${W}px: nol error konsol`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await p.close();
}

console.log(out.join('\n'));
const fails = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\nRESULT: ${out.length - fails}/${out.length} PASS`);
await b.close();
process.exit(fails ? 1 : 0);
