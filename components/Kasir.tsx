'use client';

import { usePesanan, sisaStok } from '@/lib/pesanan';
import { MENU, rupiah } from '@/lib/data';

/* ============================================================
   KASIR + KERANJANG — dua panel berdampingan, sudah terisi data nyata.
   Kesalahan landing lama: keranjang membaca atribut yang tidak ada
   sehingga nama menu jadi "undefined". Di sini semua dari satu state.
   ============================================================ */

const Ikon = ({ jenis }: { jenis: string }) => {
  const umum = 'h-11 w-11';
  switch (jenis) {
    case 'nasi':
      return (
        <svg viewBox="0 0 64 64" className={umum} aria-hidden="true">
          <ellipse cx="32" cy="46" rx="25" ry="8" fill="#e6dfd2" />
          <path d="M13 41c2-16 36-16 38 0-9 6-29 6-38 0z" fill="#f2b84b" />
          <circle cx="24" cy="35" r="2.6" fill="#e8501f" />
          <circle cx="37" cy="33" r="2.6" fill="#1f8a5b" />
          <circle cx="42" cy="38" r="2" fill="#e8501f" />
        </svg>
      );
    case 'goroho':
      return (
        <svg viewBox="0 0 64 64" className={umum} aria-hidden="true">
          <rect x="14" y="16" width="9" height="32" rx="4.5" fill="#e0a43c" transform="rotate(-14 18 32)" />
          <rect x="27" y="12" width="9" height="36" rx="4.5" fill="#f2b84b" />
          <rect x="40" y="18" width="9" height="30" rx="4.5" fill="#d89528" transform="rotate(12 44 33)" />
        </svg>
      );
    case 'kentang':
      return (
        <svg viewBox="0 0 64 64" className={umum} aria-hidden="true">
          <g fill="#f6c94c">
            <rect x="18" y="14" width="6" height="28" rx="3" transform="rotate(-8 21 28)" />
            <rect x="28" y="10" width="6" height="32" rx="3" />
            <rect x="38" y="14" width="6" height="28" rx="3" transform="rotate(9 41 28)" />
          </g>
          <path d="M16 40h32l-4 18H20z" fill="#e8501f" />
        </svg>
      );
    case 'kopi':
      return (
        <svg viewBox="0 0 64 64" className={umum} aria-hidden="true">
          <path d="M16 26h28v16a14 14 0 0 1-28 0z" fill="#fff" stroke="#1c1a17" strokeWidth="3" />
          <path d="M44 30h4a6 6 0 0 1 0 12h-5" fill="none" stroke="#1c1a17" strokeWidth="3" />
          <path d="M18 28h24v6H18z" fill="#8a5a3a" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" className={umum} aria-hidden="true">
          <path d="M18 16h28l-3 36a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4z" fill="#b8dc7a" stroke="#1c1a17" strokeWidth="3" />
          <ellipse cx="32" cy="40" rx="6" ry="8" fill="#5b8c2a" />
        </svg>
      );
  }
};

export function Kasir() {
  const { state, kirim } = usePesanan();
  const itemKeranjang = Object.entries(state.keranjang).filter(([, q]) => q > 0);
  const total = itemKeranjang.reduce((a, [id, q]) => {
    const m = MENU.find((x) => x.id === id)!;
    return a + m.harga * q;
  }, 0);
  const jumlah = itemKeranjang.reduce((a, [, q]) => a + q, 0);

  return (
    <section id="kasir" className="scroll-mt-24 bg-surface-2 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1120px] px-5">
        <h2 className="max-w-[24ch] text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold">
          Pesanan Anda, sampai ke dapur.
        </h2>
        <p className="mt-3 max-w-[52ch] text-muted">
          Stok di tiap menu ikut berkurang saat diketuk. Habis ya habis,
          tidak bisa dijual.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          {/* --- daftar menu --- */}
          <div className="rounded-[20px] bg-surface p-4 sm:p-5">
            <h3 className="mb-3 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-muted">Makanan &amp; minuman</h3>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {MENU.map((m) => {
                const sisa = sisaStok(state, m);
                const habis = sisa <= 0;
                const menipis = sisa <= 3 && !habis;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => kirim({ t: 'tambah', id: m.id })}
                    disabled={habis}
                    aria-label={`Tambah ${m.nama}, sisa ${sisa} porsi`}
                    className={[
                      'relative flex flex-col gap-1 rounded-[16px] p-3 text-left transition-all duration-150',
                      'min-h-[44px]',
                      habis
                        ? 'cursor-not-allowed bg-surface-2 opacity-50'
                        : 'bg-bg hover:-translate-y-0.5 active:scale-[0.97]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[0.8125rem] font-extrabold',
                        habis ? 'bg-acc/15 text-acc-deep' : menipis ? 'bg-warn/20 text-warn' : 'bg-ok/15 text-ok',
                      ].join(' ')}
                    >
                      {habis ? 'Habis' : menipis ? `Sisa ${sisa}` : `${sisa} porsi`}
                    </span>
                    <Ikon jenis={m.ikon} />
                    <b className="mt-0.5 text-[0.875rem] leading-tight">{m.nama}</b>
                    <small className="text-[0.8125rem] text-muted">{rupiah(m.harga)}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* --- keranjang --- */}
          <div className="flex flex-col rounded-[20px] bg-surface p-4 sm:p-5">
            <h3 className="flex items-center justify-between text-[0.9375rem] font-bold">
              <span>Meja 4</span>
              <span className="text-muted">{jumlah} item</span>
            </h3>

            <div className="mt-3 flex-1">
              {itemKeranjang.length === 0 ? (
                <p className="py-8 text-center text-[0.9375rem] text-muted">
                  Ketuk menu di sebelah untuk mulai.
                </p>
              ) : (
                <ul className="m-0 list-none p-0">
                  {itemKeranjang.map(([id, q]) => {
                    const m = MENU.find((x) => x.id === id)!;
                    return (
                      <li key={id} className="flex items-center gap-2 py-2">
                        <span className="flex-1 text-[0.875rem]">{m.nama}</span>
                        <button
                          type="button"
                          onClick={() => kirim({ t: 'kurang', id })}
                          aria-label={`Kurangi ${m.nama}`}
                          className="grid h-11 w-11 place-items-center rounded-full bg-bg font-extrabold transition-colors hover:bg-surface-2"
                        >
                          −
                        </button>
                        <b className="min-w-5 text-center text-[0.9375rem]">{q}</b>
                        <button
                          type="button"
                          onClick={() => kirim({ t: 'tambah', id })}
                          aria-label={`Tambah ${m.nama}`}
                          className="grid h-11 w-11 place-items-center rounded-full bg-bg font-extrabold transition-colors hover:bg-surface-2"
                        >
                          +
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-3 flex items-baseline justify-between text-[1.25rem] font-extrabold">
              <span>Total</span>
              <span className="text-acc">{rupiah(total)}</span>
            </div>

            <button
              type="button"
              onClick={() => kirim({ t: 'kirim' })}
              disabled={jumlah === 0}
              className="mt-3 min-h-[52px] w-full rounded-full bg-blue font-bold text-white transition-colors hover:bg-[#0a4a85] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
            >
              Kirim ke dapur
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
