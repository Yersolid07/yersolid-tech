import Link from 'next/link';

/* Halaman 404 sungguhan. Sebelumnya rute tak dikenal menghasilkan 308
   (redirect) alih-alih 404 — itu membingungkan pengunjung dan mesin
   pencari. Halaman ini memberi jalan keluar, bukan jalan buntu. */

export const metadata = { title: 'Halaman tidak ditemukan — Yersolid Tech' };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-[640px] flex-col justify-center px-5 py-16">
      <p className="m-0 text-[0.8125rem] font-bold uppercase tracking-[0.06em] text-acc">
        404
      </p>
      <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)] font-extrabold">
        Halaman ini tidak ada.
      </h1>
      <p className="mt-3 text-muted">
        Mungkin tautannya salah ketik, atau halaman sudah dipindahkan.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="flex min-h-[48px] items-center rounded-full bg-acc px-6 font-bold text-white no-underline"
        >
          Kembali ke beranda
        </Link>
        <Link
          href="/#harga"
          className="flex min-h-[48px] items-center rounded-full bg-surface-2 px-6 font-bold text-ink no-underline"
        >
          Lihat harga
        </Link>
      </div>
    </main>
  );
}
