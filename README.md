# Yersolid Tech — landing

Next.js 15 + React 19 + Tailwind 4. Halaman dirender statis; API kontak
berjalan di server Next.

## Jalankan

    npm install
    npm run dev     # http://localhost:3100
    npm run build && npm start

## Struktur

- `app/page.tsx` — susunan bagian
- `components/` — Nav, Hero, Kasir, Dapur, Laporan, Harga, Kontak
- `lib/pesanan.tsx` — mesin pesanan (satu sumber kebenaran)
- `lib/data.ts` — menu & harga nyata dari basis data wawikadio-staging
- `app/api/kontak/route.ts` — validasi + simpan ke `data/lead.jsonl`

## Verifikasi

    node audit.mjs http://127.0.0.1:3900/   # 7 ukuran + 9 interaksi
