'use client';

import { useState } from 'react';

/* ============================================================
   NAV — drawer di HP.
   Kesalahan landing lama: site.js tidak termuat sehingga hamburger mati
   total. Di sini handler ada di komponen yang sama dengan tombolnya,
   jadi tidak mungkin putus.
   ============================================================ */

const TAUTAN = [
  { href: '#kasir', label: 'Kasir' },
  { href: '#dapur', label: 'Dapur' },
  { href: '#laporan', label: 'Laporan' },
  { href: '#harga', label: 'Harga' },
  { href: '#kontak', label: 'Kontak' },
];

export function Nav() {
  const [buka, setBuka] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1120px] items-center gap-4 px-5 py-3">
        <a href="#atas" className="flex min-h-[44px] items-center gap-2.5 font-extrabold tracking-tight text-ink no-underline">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-acc text-[0.9375rem] text-white" aria-hidden="true">
            Y
          </span>
          Yersolid Tech
        </a>

        <nav className="ml-auto hidden items-center gap-1 sm:flex" aria-label="Navigasi utama">
          {TAUTAN.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="nav-tautan flex min-h-[44px] items-center rounded-full px-3 text-[0.9375rem] font-semibold text-muted no-underline transition-colors hover:text-ink"
            >
              {t.label}
            </a>
          ))}
        </nav>

        <a
          href="#harga"
          className="ml-auto hidden min-h-[44px] items-center rounded-full bg-acc px-5 text-[0.9375rem] font-bold text-white no-underline transition-colors hover:bg-acc-deep sm:ml-0 sm:inline-flex"
        >
          Coba 14 hari
        </a>

        <button
          type="button"
          onClick={() => setBuka((v) => !v)}
          aria-expanded={buka}
          aria-controls="drawer"
          aria-label={buka ? 'Tutup menu' : 'Buka menu'}
          className="ml-auto grid h-11 w-11 place-items-center rounded-[12px] bg-surface sm:hidden"
        >
          <span aria-hidden="true" className="relative block h-4 w-5">
            <span
              className="absolute left-0 block h-0.5 w-5 rounded bg-ink transition-transform duration-200"
              style={{ top: buka ? 7 : 0, transform: buka ? 'rotate(45deg)' : 'none' }}
            />
            <span
              className="absolute left-0 block h-0.5 w-5 rounded bg-ink transition-opacity duration-200"
              style={{ top: 7, opacity: buka ? 0 : 1 }}
            />
            <span
              className="absolute left-0 block h-0.5 w-5 rounded bg-ink transition-transform duration-200"
              style={{ top: buka ? 7 : 14, transform: buka ? 'rotate(-45deg)' : 'none' }}
            />
          </span>
        </button>
      </div>

      {buka && (
        <nav id="drawer" className="animate-muncul mx-auto w-full max-w-[1120px] px-5 pb-4 sm:hidden" aria-label="Navigasi HP">
          <ul className="m-0 grid list-none gap-1 rounded-[16px] bg-surface p-2">
            {TAUTAN.map((t) => (
              <li key={t.href}>
                <a
                  href={t.href}
                  onClick={() => setBuka(false)}
                  className="flex min-h-[48px] items-center rounded-[12px] px-3 font-semibold text-ink no-underline transition-colors hover:bg-surface-2"
                >
                  {t.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#harga"
                onClick={() => setBuka(false)}
                className="mt-1 flex min-h-[48px] items-center justify-center rounded-[12px] bg-acc font-bold text-white no-underline"
              >
                Coba 14 hari
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
