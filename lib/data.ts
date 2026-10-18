// Data nyata. Menu & harga diambil dari basis data wawikadio-staging (menu_items):
// "goroho stick 20" Rp 20.000, "Kentang goreng" Rp 18.000, "Kopi susu Besar" Rp 15.000.
// Jangan mengarang nama atau harga baru tanpa memeriksa sumbernya lagi.

export type Menu = {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  ikon: 'nasi' | 'goroho' | 'kentang' | 'kopi' | 'jus';
};

export const MENU: Menu[] = [
  { id: 'nasi', nama: 'Nasi Goreng Roa', harga: 25000, stok: 12, ikon: 'nasi' },
  { id: 'goroho', nama: 'goroho stick 20', harga: 20000, stok: 8, ikon: 'goroho' },
  { id: 'kentang', nama: 'Kentang goreng', harga: 18000, stok: 10, ikon: 'kentang' },
  { id: 'kopi', nama: 'Kopi susu Besar', harga: 15000, stok: 14, ikon: 'kopi' },
  { id: 'jus', nama: 'Jus Alpukat', harga: 15000, stok: 6, ikon: 'jus' },
];

// Fitur sejajar: setiap paket menyebut fitur yang SAMA, dibedakan ada/tidak.
// Sebelumnya paket mahal tidak menyebut "kasir & layar dapur" sehingga
// pembaca mengira fitur itu hilang di paket atas.
export const FITUR: { nama: string; paket: [boolean, boolean, boolean] }[] = [
  { nama: 'Kasir & layar dapur', paket: [true, true, true] },
  { nama: 'Stok & laporan harian', paket: [true, true, true] },
  { nama: 'Peringatan stok menipis', paket: [false, true, true] },
  { nama: 'Laporan mingguan & ekspor', paket: [false, true, true] },
  { nama: 'Akses API', paket: [false, false, true] },
  { nama: 'Dukungan prioritas 24/7', paket: [false, false, true] },
];

export const PAKET = [
  {
    nama: 'Starter',
    harga: 150000,
    label: '150rb',
    populer: false,
    outlet: '1 outlet',
  },
  {
    nama: 'Professional',
    harga: 300000,
    label: '300rb',
    populer: true,
    outlet: '3 outlet',
  },
  {
    nama: 'Enterprise',
    harga: 500000,
    label: '500rb',
    populer: false,
    outlet: 'Outlet tanpa batas',
  },
];

export const FAKTA = [
  { angka: '853', satuan: 'pesanan', label: 'Pesanan tercatat' },
  { angka: '<1 dtk', satuan: 'ke dapur', label: 'Layar dapur' },
  { angka: '0', satuan: 'rekap manual', label: 'Rekap malam' },
];

export const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
