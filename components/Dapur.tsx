'use client';

import { useEffect, useState } from 'react';
import { usePesanan, type Pesanan } from '@/lib/pesanan';
import { rupiah } from '@/lib/data';

/* ============================================================
   DAPUR — tiga kolom yang benar-benar bergerak.
   Pesanan berjalan sendiri: masuk -> masak -> siap, dengan bar progres.
   Kesalahan landing lama: kolom sering kosong dan bar tanpa arti.
   ============================================================ */

function Kartu({ p, progres }: { p: Pesanan; progres?: number }) {
  return (
    <li className="animate-tiket rounded-[14px] bg-surface p-3.5 shadow-[0_1px_2px_rgba(28,26,23,0.05),0_10px_24px_-14px_rgba(28,26,23,0.35)]">
      <div className="flex items-baseline justify-between">
        <b className="text-[0.9375rem]">#{p.no}</b>
        <b className="text-[0.875rem] text-muted">{rupiah(p.total)}</b>
      </div>
      <ul className="m-0 mt-1.5 list-none p-0">
        {p.items.map((i) => (
          <li key={i.id} className="text-[0.8125rem] leading-snug text-muted">
            {i.qty}× {i.nama}
          </li>
        ))}
      </ul>
      {progres !== undefined && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(progres)} aria-valuemin={0} aria-valuemax={100} aria-label={`Memasak pesanan ${p.no}`}>
          <i
            className="block h-full rounded-full bg-acc transition-[width] duration-200 ease-linear"
            style={{ width: `${progres}%` }}
          />
        </div>
      )}
    </li>
  );
}

const KOLOM = [
  { kunci: 'masuk' as const, judul: 'Masuk' },
  { kunci: 'masak' as const, judul: 'Dimasak' },
  { kunci: 'siap' as const, judul: 'Siap' },
];

export function Dapur() {
  const { state, kirim } = usePesanan();
  const [sekarang, setSekarang] = useState(0);

  // Jam berdenyut hanya saat ada yang dimasak, supaya tidak membebani HP.
  const adaMasak = state.pesanan.some((p) => p.tahap === 'masak');
  const adaMasuk = state.pesanan.some((p) => p.tahap === 'masuk');

  useEffect(() => {
    if (!adaMasak && !adaMasuk) return;
    const t = setInterval(() => setSekarang(Date.now()), 250);
    return () => clearInterval(t);
  }, [adaMasak, adaMasuk]);

  // transisi otomatis
  useEffect(() => {
    if (!sekarang) return;
    state.pesanan.forEach((p) => {
      const umur = sekarang - p.mulai;
      if (p.tahap === 'masuk' && umur > 1800) kirim({ t: 'masak' });
      if (p.tahap === 'masak' && umur > 6500) kirim({ t: 'siap' });
    });
  }, [sekarang, state.pesanan, kirim]);

  const kosong = state.pesanan.filter((p) => p.tahap !== 'lunas').length === 0;

  return (
    <section id="dapur" className="scroll-mt-24 bg-bg py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1120px] px-5">
        <h2 className="max-w-[24ch] text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold">
          Tiketnya sudah masuk dapur.
        </h2>
        <p className="mt-3 max-w-[52ch] text-muted">
          Tukang masak melihat tiket yang sama. Bergeser sendiri dari masuk
          ke dimasak ke siap.
        </p>

        {kosong && (
          <div className="mt-7 rounded-[20px] bg-surface p-6 text-center">
            <p className="font-bold">Belum ada pesanan di dapur.</p>
            <p className="mt-1 text-[0.9375rem] text-muted">
              Kirim dari kasir di atas, atau pakai contoh.
            </p>
            <button
              type="button"
              onClick={() => kirim({ t: 'contoh' })}
              className="mt-4 min-h-[48px] rounded-full bg-ink px-6 font-bold text-white transition-colors hover:bg-[#33302b]"
            >
              Pakai contoh pesanan
            </button>
          </div>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {KOLOM.map((k) => {
            const isi = state.pesanan.filter((p) => p.tahap === k.kunci);
            return (
              <div key={k.kunci} className="rounded-[20px] bg-surface-2 p-3">
                <h3 className="mb-2.5 flex items-center justify-between px-1 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-muted">
                  <span>{k.judul}</span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[0.8125rem] text-ink">{isi.length}</span>
                </h3>
                {isi.length === 0 ? (
                  <p className="px-1 pb-2 text-[0.8125rem] text-muted">Kosong</p>
                ) : (
                  <ul className="m-0 grid list-none gap-2 p-0">
                    {isi.map((p) => (
                      <Kartu
                        key={p.no}
                        p={p}
                        progres={
                          k.kunci === 'masak'
                            ? Math.min(100, Math.max(0, ((sekarang - p.mulai) / 6500) * 100))
                            : undefined
                        }
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
