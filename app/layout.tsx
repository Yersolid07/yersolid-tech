import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PesananProvider } from '@/lib/pesanan';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Kasir } from '@/components/Kasir';
import { Dapur } from '@/components/Dapur';
import { Laporan } from '@/components/Laporan';
import { Harga, Bukti, Penutup } from '@/components/Harga';

export const metadata: Metadata = {
  /* metadataBase menentukan domain absolut untuk og:image dan canonical.
     Sebelumnya menunjuk saas.yersolid.web.id (domain lama) sehingga
     pratinjau WhatsApp mengambil gambar dari domain yang salah.
     Nanti saat pindah domain, cukup ubah SATU nilai ini. */
  metadataBase: new URL(process.env.SITE_URL ?? 'https://coba.yersolid.web.id'),
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'Yersolid Tech',
  },
  twitter: { card: 'summary_large_image' },
  title: 'Yersolid Tech — kasir, dapur, dan laporan dalam satu alur',
  description:
    'Ketuk menu di kasir, tiket muncul di dapur, stok berkurang, laporan terisi sendiri. Mulai Rp 150.000/bulan.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f2ea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <a
          href="#kasir"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
        >
          Lompat ke isi
        </a>
        <PesananProvider>
          <Nav />
          {children}
          <Penutup />
        </PesananProvider>
      </body>
    </html>
  );
}
