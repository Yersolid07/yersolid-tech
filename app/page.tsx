import { Hero } from '@/components/Hero';
import { Kasir } from '@/components/Kasir';
import { Dapur } from '@/components/Dapur';
import { Laporan } from '@/components/Laporan';
import { Harga, Bukti } from '@/components/Harga';
import { Kontak } from '@/components/Kontak';

export default function Page() {
  return (
    <main>
      <Hero />
      <Kasir />
      <Dapur />
      <Laporan />
      <Harga />
      <Bukti />
      <Kontak />
    </main>
  );
}
