'use client';

import { createContext, useContext, useReducer, useMemo, type ReactNode } from 'react';
import { MENU, type Menu } from '@/lib/data';

/* ============================================================
   MESIN PESANAN — satu sumber kebenaran untuk seluruh alur.
   Semua bagian (kasir, dapur, laporan, stok) membaca dari sini, jadi
   angka di layar tidak mungkin berbeda satu sama lain.
   ============================================================ */

export type Tahap = 'masuk' | 'masak' | 'siap' | 'lunas';

export type Item = { id: string; nama: string; harga: number; qty: number };

export type Pesanan = {
  no: number;
  items: Item[];
  total: number;
  tahap: Tahap;
  mulai: number;
};

type State = {
  keranjang: Record<string, number>;
  pesanan: Pesanan[];
  nomor: number;
};

type Aksi =
  | { t: 'tambah'; id: string }
  | { t: 'kurang'; id: string }
  | { t: 'kirim' }
  | { t: 'masak' }
  | { t: 'siap' }
  | { t: 'lunas'; no: number }
  | { t: 'contoh' };

const AWAL: State = { keranjang: {}, pesanan: [], nomor: 117 };

function stokTerpakai(state: State, id: string) {
  return state.pesanan
    .flatMap((p) => p.items)
    .filter((i) => i.id === id)
    .reduce((a, i) => a + i.qty, 0);
}

export function sisaStok(state: State, menu: Menu) {
  return menu.stok - stokTerpakai(state, menu.id) - (state.keranjang[menu.id] ?? 0);
}

function reducer(state: State, aksi: Aksi): State {
  switch (aksi.t) {
    case 'tambah': {
      const menu = MENU.find((m) => m.id === aksi.id);
      if (!menu) return state;
      if (sisaStok(state, menu) <= 0) return state; // habis ya habis
      return {
        ...state,
        keranjang: { ...state.keranjang, [aksi.id]: (state.keranjang[aksi.id] ?? 0) + 1 },
      };
    }
    case 'kurang': {
      const n = (state.keranjang[aksi.id] ?? 0) - 1;
      const k = { ...state.keranjang };
      if (n <= 0) delete k[aksi.id];
      else k[aksi.id] = n;
      return { ...state, keranjang: k };
    }
    case 'kirim': {
      const items = Object.entries(state.keranjang)
        .filter(([, q]) => q > 0)
        .map(([id, qty]) => {
          const m = MENU.find((x) => x.id === id)!;
          return { id, nama: m.nama, harga: m.harga, qty };
        });
      if (!items.length) return state;
      const nomor = state.nomor + 1;
      const total = items.reduce((a, i) => a + i.harga * i.qty, 0);
      return {
        keranjang: {},
        nomor,
        pesanan: [...state.pesanan, { no: nomor, items, total, tahap: 'masuk', mulai: Date.now() }],
      };
    }
    case 'masak':
      return {
        ...state,
        pesanan: state.pesanan.map((p) => (p.tahap === 'masuk' ? { ...p, tahap: 'masak', mulai: Date.now() } : p)),
      };
    case 'siap':
      return {
        ...state,
        pesanan: state.pesanan.map((p) => (p.tahap === 'masak' ? { ...p, tahap: 'siap' } : p)),
      };
    case 'lunas':
      return {
        ...state,
        pesanan: state.pesanan.map((p) => (p.no === aksi.no ? { ...p, tahap: 'lunas' } : p)),
      };
    case 'contoh': {
      // pakai menu yang benar-benar ada, bukan karangan
      const nomor = state.nomor + 1;
      const items = [
        { id: 'nasi', nama: MENU[0].nama, harga: MENU[0].harga, qty: 2 },
        { id: 'kopi', nama: MENU[3].nama, harga: MENU[3].harga, qty: 1 },
      ];
      return {
        ...state,
        nomor,
        keranjang: {},
        pesanan: [
          ...state.pesanan,
          { no: nomor, items, total: items.reduce((a, i) => a + i.harga * i.qty, 0), tahap: 'masuk', mulai: Date.now() },
        ],
      };
    }
    default:
      return state;
  }
}

const Ctx = createContext<{ state: State; kirim: (a: Aksi) => void } | null>(null);

export function PesananProvider({ children }: { children: ReactNode }) {
  const [state, kirim] = useReducer(reducer, AWAL);
  const nilai = useMemo(() => ({ state, kirim }), [state]);
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function usePesanan() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePesanan harus di dalam PesananProvider');
  return v;
}

/* ------------ turunan ------------ */
export function totalKeranjang(keranjang: Record<string, number>) {
  return Object.entries(keranjang).reduce((a, [id, q]) => {
    const m = MENU.find((x) => x.id === id);
    return a + (m ? m.harga * q : 0);
  }, 0);
}

export function jumlahKeranjang(keranjang: Record<string, number>) {
  return Object.values(keranjang).reduce((a, q) => a + q, 0);
}

export function ringkasanLaporan(pesanan: Pesanan[]) {
  const lunas = pesanan.filter((p) => p.tahap === 'lunas');
  const total = lunas.reduce((a, p) => a + p.total, 0);
  const perMenu: Record<string, number> = {};
  lunas.forEach((p) => p.items.forEach((i) => { perMenu[i.nama] = (perMenu[i.nama] ?? 0) + i.qty; }));
  return {
    jumlahLunas: lunas.length,
    total,
    rataRata: lunas.length ? Math.round(total / lunas.length) : 0,
    terlaris: Object.entries(perMenu).sort((a, b) => b[1] - a[1]),
  };
}
