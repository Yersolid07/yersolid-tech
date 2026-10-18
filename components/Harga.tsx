import { PAKET, FITUR } from '@/lib/data';

/* ============================================================
   HARGA + BUKTI + PENUTUP
   Kartu paket ditandai jelas mana yang disarankan — landing lama hanya
   membedakan warna tanpa label, sehingga pembaca tidak tahu.
   ============================================================ */

export function Harga() {
  return (
    <section id="harga" className="scroll-mt-24 bg-surface-2 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1120px] px-5">
        <h2 className="masuk text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold">Harga terbuka, tanpa nego.</h2>
        <p className="mt-3 max-w-[46ch] text-muted">
          Bayar bulanan, berhenti kapan saja. Harga per outlet, belum termasuk pajak.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PAKET.map((p) => (
            <div
              key={p.nama}
              className={[
                'relative flex flex-col rounded-[20px] p-5',
                p.populer ? 'bg-ink text-bg' : 'bg-surface',
              ].join(' ')}
            >
              {p.populer && (
                <span className="absolute -top-3 left-5 rounded-full bg-acc px-3 py-1 text-[0.8125rem] font-extrabold text-white">
                  Paling populer
                </span>
              )}
              <h3 className="text-[1.0625rem] font-bold">{p.nama}</h3>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-[2rem] font-extrabold leading-none tracking-tight">
                  Rp {p.label}
                </span>
                <span className={p.populer ? 'text-[0.875rem] text-bg/70' : 'text-[0.875rem] text-muted'}>
                  /bulan
                </span>
              </p>
              <p className="m-0 mt-3 text-[0.9375rem] font-semibold">{p.outlet}</p>
              <a
                href={`mailto:halo@yersolid.web.id?subject=Paket%20${encodeURIComponent(p.nama)}`}
                className={[
                  'mt-5 flex min-h-[48px] items-center justify-center rounded-full font-bold no-underline transition-transform active:scale-[0.98]',
                  p.populer ? 'bg-acc text-white' : 'bg-surface-2 text-ink',
                ].join(' ')}
              >
                Pilih {p.nama}
              </a>
            </div>
          ))}
        </div>

        {/* Tabel perbandingan: satu sumber kebenaran, semua paket sejajar.
            Di HP tabel digulir mendatar, bukan dipecah jadi 3 daftar. */}
        {/* HP: daftar per paket supaya kolom tidak berdesakan.
            Tablet ke atas: tabel perbandingan penuh. */}
        <ul className="m-0 mt-8 grid list-none gap-2 p-0 sm:hidden">
          {FITUR.map((f) => (
            <li key={f.nama} className="rounded-[14px] bg-surface p-3">
              <p className="m-0 text-[0.9375rem] font-semibold">{f.nama}</p>
              <p className="m-0 mt-1 flex gap-3 text-[0.8125rem] text-muted">
                {PAKET.map((p, i) => (
                  <span key={p.nama} className={f.paket[i] ? 'text-ok' : ''}>
                    {f.paket[i] ? '✓' : '—'} {p.nama}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8 hidden rounded-[20px] bg-surface p-4 sm:block sm:overflow-x-auto sm:p-0">
          <table className="w-full border-collapse text-left sm:min-w-[480px]">
            <thead>
              <tr>
                <th scope="col" className="p-2 text-[0.875rem] font-semibold text-muted sm:p-4">Fitur</th>
                {PAKET.map((p) => (
                  <th key={p.nama} scope="col" className="p-2 text-center text-[0.875rem] font-bold sm:p-4">
                    {p.nama}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FITUR.map((f) => (
                <tr key={f.nama} className="border-t border-[var(--line)]">
                  <th scope="row" className="p-2 text-[0.9375rem] font-normal leading-snug break-words sm:p-4">{f.nama}</th>
                  {f.paket.map((ada, i) => (
                    <td key={i} className="p-2 text-center sm:p-4">
                      {ada ? (
                        <span className="text-ok" aria-label="termasuk">✓</span>
                      ) : (
                        <span className="text-[var(--line)]" aria-label="tidak termasuk">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function Bukti() {
  return (
    <section id="bukti" className="scroll-mt-24 bg-bg py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1120px] px-5">
        <h2 className="masuk max-w-[26ch] text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold">
          Sudah dipakai, salah satunya Wawi Kadio.
        </h2>
        <p className="mt-3 max-w-[52ch] text-muted">
          Wawi Kadio restoran di Minahasa. Berikut yang mereka rasakan setelah
          memindahkan pesanan dari kertas ke sistem.
        </p>

        <figure className="m-0 mt-7 rounded-[20px] bg-surface p-5 sm:p-7">
          <figcaption className="text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-acc">
            Contoh pengguna
          </figcaption>
          <blockquote className="m-0 mt-2 max-w-[54ch] text-[clamp(1.0625rem,2.2vw,1.25rem)] font-semibold leading-snug">
            Sebelumnya pesanan ditulis di kertas, lalu dibaca ulang di dapur.
            Sekarang kasir mengetuk menu, tiketnya muncul di layar dapur, dan
            sisa bahan langsung terlihat.
          </blockquote>
          <footer className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-acc/15 font-extrabold text-acc-deep" aria-hidden="true">
              WK
            </span>
            <span>
              <b className="block text-[0.9375rem]">Wawi Kadio</b>
              <span className="text-[0.875rem] text-muted">Restoran &amp; kafe, Minahasa, Sulawesi Utara</span>
            </span>
          </footer>
        </figure>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { n: '853', l: 'Pesanan tercatat' },
            { n: '15+', l: 'Menu di sistem' },
            { n: '3', l: 'Modul terpakai' },
          ].map((s) => (
            <div key={s.l} className="rounded-[16px] bg-surface p-4">
              <dd className="m-0 text-[1.5rem] font-extrabold leading-none tracking-tight">{s.n}</dd>
              <dt className="mt-1 text-[0.8125rem] text-muted">{s.l}</dt>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-[0.8125rem] text-muted">
          Angka dari data uji internal Wawi Kadio, bukan klaim volume.
        </p>
      </div>
    </section>
  );
}

export function Penutup() {
  return (
    <footer className="bg-ink px-5 py-16 text-bg">
      <div className="mx-auto w-full max-w-[1120px] text-center">
        <h2 className="text-[clamp(1.8rem,4.6vw,3rem)] font-extrabold">
          Mulai dari kasir sore ini.
        </h2>
        <p className="mx-auto mt-3 max-w-[46ch] text-[0.9375rem] text-bg/70">
          Coba 14 hari dengan menu Anda sendiri. Tidak cocok, tidak ada tagihan.
        </p>
        <a
          href="mailto:halo@yersolid.web.id?subject=Coba%20Yersolid%20Tech"
          className="mt-6 inline-flex min-h-[54px] items-center justify-center rounded-full bg-acc px-8 font-bold text-white no-underline transition-transform active:scale-[0.98]"
        >
          Minta akses coba
        </a>
        <p className="mt-12 text-[0.8125rem] text-bg/50">
          © {new Date().getFullYear()} Yersolid Tech · halo@yersolid.web.id
        </p>
      </div>
    </footer>
  );
}
