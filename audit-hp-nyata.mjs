// Audit HP lambat: ukur SETELAH DOM siap, tanpa asumsi waktu.
import { chromium } from 'playwright-core';

const URL = process.argv[2] || 'http://127.0.0.1:8099/';
const b = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const [name, cpu, blockJs] of [
  ['normal', 1, false],
  ['cpu 6x lambat', 6, false],
  ['jaringan+jS lambat', 6, true],
]) {
  const ctx = await b.newContext({
    viewport: { width: 360, height: 640 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (blockJs) {
    await p.route('**/gsap*.js', (r) => r.abort());
    await p.route('**/ScrollTrigger*.js', (r) => r.abort());
  }

  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // tunggu elemen yang diaudit benar-benar ada
  await p.waitForSelector('#laporan .head', { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(2000);

  // Sebelum digulir: isi harus sudah terbaca (bukan menunggu animasi)
  const before = await p.evaluate(() => {
    const check = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return 'tidak ada';
      const cs = getComputedStyle(el);
      return { op: cs.opacity, h: Math.round(el.getBoundingClientRect().height) };
    };
    return {
      laporanJudul: check('#laporan .head'),
      laporanBody: check('#laporan .body'),
      laporanMedia: check('#laporan .row-media'),
      hargaJudul: check('#harga .head'),
      reveal0: [...document.querySelectorAll('.reveal')].filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length,
    };
  });

  // sesudah digulir penuh
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(90);
  }
  await p.waitForTimeout(1500);

  const after = await p.evaluate(() => {
    const vis = (sel) => {
      const el = document.querySelector(sel);
      return el ? Number(getComputedStyle(el).opacity) : null;
    };
    return {
      revealSisa: [...document.querySelectorAll('.reveal')].filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length,
      judul: vis('#laporan .head'),
      media: vis('#laporan .row-media'),
      hargaKartu: vis('.plan-card'),
      totalTeks: (document.getElementById('rep-total')?.textContent || '').trim(),
    };
  });

  const okBefore =
    before.laporanJudul.op === '1' &&
    before.laporanBody.op === '1' &&
    before.laporanMedia.op === '1';
  const okAfter = after.revealSisa === 0 && after.judul === 1 && after.hargaKartu === 1;

  console.log(`\n[${name}] sebelum-gulir-terbaca=${okBefore} | sesudah-gulir-terbaca=${okAfter}`);
  console.log('  sebelum:', JSON.stringify(before));
  console.log('  sesudah:', JSON.stringify(after));
  await ctx.close();
}
await b.close();
