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

export const PAKET = [
  {
    nama: 'Starter',
    harga: 150000,
    label: '150rb',
    populer: false,
    fitur: ['1 outlet', 'Kasir & layar dapur', 'Stok & laporan harian'],
  },
  {
    nama: 'Professional',
    harga: 300000,
    label: '300rb',
    populer: true,
    fitur: ['3 outlet', 'Peringatan stok menipis', 'Laporan mingguan'],
  },
  {
    nama: 'Enterprise',
    harga: 500000,
    label: '500rb',
    populer: false,
    fitur: ['Outlet tanpa batas', 'Akses API & ekspor', 'Dukungan 24/7'],
  },
];

export const FAKTA = [
  { angka: '853', satuan: 'pesanan', label: 'Pesanan tercatat' },
  { angka: '<1 dtk', satuan: 'ke dapur', label: 'Layar dapur' },
  { angka: '0', satuan: 'rekap manual', label: 'Rekap malam' },
];

export const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
