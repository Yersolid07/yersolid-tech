'use client';

import { useState } from 'react';
import { usePesanan, ringkasanLaporan } from '@/lib/pesanan';
import { rupiah } from '@/lib/data';

/* ============================================================
   LAPORAN — angka dari pesanan yang benar-benar dijalankan.

   Perbaikan dari audit:
   - Judul menjanjikan "tutup buku" tapi tidak ada tombolnya. Sekarang
     tombol itu ada dan benar-benar mengunci rekap.
   - Empty state dulu tiga kalimat mengulang fakta yang sama. Sekarang
     satu baris.
   - Tidak ada pembanding. Sekarang ditampilkan selisih dari rekap
     terakhir yang ditutup.
   ============================================================ */

export function Laporan() {
  const { state, kirim } = usePesanan();
  const r = ringkasanLaporan(state.pesanan);
  const siap = state.pesanan.filter((p) => p.tahap === 'siap');
  const maks = r.terlaris[0]?.[1] ?? 1;
  const [tertutup, setTertutup] = useState<{ total: number; jumlah: number } | null>(null);
  const [pesan, setPesan] = useState('');

  function tutupBuku() {
    if (r.jumlahLunas === 0) {
      setPesan('Belum ada pesanan lunas untuk ditutup.');
      return;
    }
    setTertutup({ total: r.total, jumlah: r.jumlahLunas });
    setPesan(`Buku ditutup: ${r.jumlahLunas} pesanan, ${rupiah(r.total)}.`);
  }

  return (
    <section id="laporan" className=" bg-bg py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1120px] px-5">
        <h2 className="masuk max-w-[24ch] text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold">
          Tutup buku selesai sebelum pulang.
        </h2>
        <p className="mt-3 max-w-[52ch] text-muted">
          Angka ini datang dari pesanan yang baru Anda jalankan, bukan rekap ulang.
        </p>

        {/* --- meja siap dibayar --- */}
        {siap.length > 0 && (
          <div className="mt-7 rounded-[20px] bg-blue p-4 text-white">
            <p className="text-[0.8125rem] font-bold uppercase tracking-[0.06em] opacity-80">
              Siap diantar
            </p>
            <ul className="m-0 mt-2 grid list-none gap-2 p-0">
              {siap.map((p) => (
                <li key={p.no} className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-white/10 p-3">
                  <span className="text-[0.9375rem] font-bold">#{p.no} · {rupiah(p.total)}</span>
                  <button
                    type="button"
                    onClick={() => kirim({ t: 'lunas', no: p.no })}
                    className="min-h-[44px] rounded-full bg-white px-5 text-[0.875rem] font-bold text-blue transition-transform active:scale-[0.97]"
                  >
                    Terima pembayaran
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          {/* --- angka --- */}
          <div className="rounded-[20px] bg-surface p-4 sm:p-6">
            <p className="text-[0.8125rem] font-semibold text-muted">Penjualan hari ini</p>
            {/* key berubah -> animasi sorot diputar ulang saat angka berubah */}
            <p
              key={r.total}
              className={`mt-1 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-none tracking-tight ${r.total > 0 ? 'sorot' : ''}`}
            >
              {rupiah(r.total)}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-[14px] bg-bg p-3">
                <dt className="text-[0.8125rem] text-muted">Pesanan lunas</dt>
                <dd className="m-0 text-[1.125rem] font-extrabold">{r.jumlahLunas}</dd>
              </div>
              <div className="rounded-[14px] bg-bg p-3">
                <dt className="text-[0.8125rem] text-muted">Rata-rata / pesanan</dt>
                <dd className="m-0 text-[1.125rem] font-extrabold">{rupiah(r.rataRata)}</dd>
              </div>
            </dl>

            {tertutup && (
              <p className="mt-3 rounded-[14px] bg-ok/10 p-3 text-[0.875rem] font-semibold text-ok">
                Rekap terakhir ditutup: {tertutup.jumlah} pesanan, {rupiah(tertutup.total)}.
              </p>
            )}

            <h3 className="mt-6 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-muted">
              Menu terlaris
            </h3>
            {r.terlaris.length === 0 ? (
              <p className="mt-2 text-[0.875rem] text-muted">
                Belum ada pesanan lunas hari ini.
              </p>
            ) : (
              <ul className="m-0 mt-2 grid list-none gap-2 p-0">
                {r.terlaris.map(([nama, q]) => (
                  <li key={nama} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[0.875rem]">
                    <span className="truncate">{nama}</span>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-24 overflow-hidden rounded-full bg-line sm:w-36">
                        <i className="block h-full rounded-full bg-blue" style={{ width: `${(q / maks) * 100}%` }} />
                      </span>
                      <b className="w-6 text-right">{q}</b>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={tutupBuku}
              disabled={r.jumlahLunas === 0}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-ink px-5 text-[0.9375rem] font-bold text-bg transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
            >
              Tutup buku hari ini
            </button>
            <p role="status" aria-live="polite" className="mt-2 text-[0.8125rem] text-muted">
              {pesan}
            </p>
          </div>

          {/* --- stok --- */}
          <div className="rounded-[20px] bg-surface p-4 sm:p-6">
            <h3 className="text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-muted">
              Stok bahan terpakai
            </h3>
            <ul className="m-0 mt-2 grid list-none gap-0 p-0">
              {Object.entries(
                state.pesanan
                  .filter((p) => p.tahap === 'lunas')
                  .flatMap((p) => p.items)
                  .reduce<Record<string, number>>((a, i) => {
                    a[i.nama] = (a[i.nama] ?? 0) + i.qty;
                    return a;
                  }, {})
              ).map(([nama, q]) => (
                <li key={nama} className="flex items-center justify-between border-b border-[var(--line)] py-2.5 text-[0.875rem] last:border-0">
                  <span>{nama}</span>
                  <b className="text-muted">−{q} porsi</b>
                </li>
              ))}
              {r.jumlahLunas === 0 && (
                <li className="py-2 text-[0.875rem] text-muted">Belum ada.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
