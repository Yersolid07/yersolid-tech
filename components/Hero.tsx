'use client';

import { FAKTA } from '@/lib/data';

/* ============================================================
   HERO — penuh satu layar.
   Kesalahan landing lama: judul 27px (ukuran section heading, bukan
   display), hero hanya "kebetulan" penuh di layar pendek, dan microcopy
   CTA menumpuk -5px ke dalam tombol.

   Di sini judul memakai clamp 2,35rem -> 4,4rem, dan hero memakai
   min-height 100svh DI DESKTOP MAUPUN HP (dulu hanya HP), dengan tiga
   baris: judul+CTA di atas, fakta menempel dasar layar.
   ============================================================ */

export function Hero() {
  return (
    <header className="hero" id="atas">
      <div className="hero-inner mx-auto w-full max-w-[1120px] px-5">
        <div className="flex flex-col justify-center">
          {/* --- judul --- */}
          <h1 className="hero-title">
            Satu ketukan di kasir, <em>stok ikut berkurang</em>.
          </h1>

          <p className="mt-5 max-w-[42ch] text-[clamp(1rem,2.4vw,1.1875rem)] leading-relaxed text-muted">
            Ketuk satu menu. Tiketnya muncul di dapur, stoknya berkurang,
            laporannya terisi — sendiri.
          </p>

          {/* --- aksi --- */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#kasir"
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-acc px-8 font-bold text-white transition-[transform,background-color] duration-200 hover:bg-acc-deep active:scale-[0.98]"
            >
              Mulai dari kasir
              <span aria-hidden="true">↓</span>
            </a>
            <a
              href="#harga"
              className="inline-flex min-h-[54px] items-center justify-center rounded-full px-8 font-bold text-ink underline decoration-acc decoration-2 underline-offset-4 transition-colors duration-200 hover:bg-surface-2"
            >
              Lihat harga
            </a>
          </div>

          <p className="mt-4 text-[0.875rem] text-muted">
            Tanpa kartu kredit. Bisa berhenti kapan saja.
          </p>
        </div>

        {/* --- bukti visual: mengisi ruang antara copy dan fakta ---
            Tanpa ini ada jurang ~250px di HP yang terbaca sebagai bug. */}
        <div className="mt-auto mb-4 hidden min-[380px]:flex" aria-hidden="true">
          <div className="w-full rounded-[18px] bg-surface p-3 shadow-[0_1px_2px_rgba(28,26,23,0.05),0_14px_32px_-18px_rgba(28,26,23,0.4)]">
            <div className="flex items-center justify-between rounded-[12px] bg-ink px-3 py-2">
              <span className="text-[0.8125rem] font-bold text-bg">Kasir — Resto Anda</span>
              <span className="rounded-full bg-acc px-2 py-0.5 text-[0.8125rem] font-bold text-white">Meja 4</span>
            </div>
            <div className="mt-2 grid gap-1.5">
              {[
                ['Nasi Goreng Roa', '12 porsi'],
                ['goroho stick 20', '8 porsi'],
                ['Kopi susu Besar', '14 porsi'],
              ].map(([nama, sisa]) => (
                <div key={nama} className="flex items-center justify-between rounded-[10px] bg-bg px-3 py-2">
                  <span className="text-[0.8125rem] font-semibold">{nama}</span>
                  <span className="text-[0.8125rem] text-muted">{sisa}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- fakta: menempel dasar layar --- */}
        <dl className="grid grid-cols-3 gap-3 pb-6 pt-2 sm:gap-8">
          {FAKTA.map((f) => (
            <div key={f.label} className="flex flex-col-reverse gap-0.5">
              <dt className="text-[0.8125rem] font-semibold leading-tight text-muted">{f.label}</dt>
              <dd className="m-0">
                <b className="block text-[clamp(1.35rem,3.4vw,1.9rem)] font-extrabold leading-none tracking-tight text-ink">
                  {f.angka}
                </b>
                <span className="mt-0.5 block text-[0.8125rem] leading-tight text-muted">{f.satuan}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
