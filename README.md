# Yersolid Tech — Landing Page

Landing page statis untuk **Wawi Kadio**, sistem manajemen restoran (kasir, layar dapur,
reservasi, stok bahan) yang dijual sebagai langganan bulanan.

Live: <https://saas.yersolid.web.id/>

HTML + CSS + JS murni. Tanpa build step, tanpa framework, tanpa dependensi runtime.
Total payload ~1 MB (mayoritas dua foto).

## Menjalankan

```bash
python3 -m http.server 8099
# buka http://127.0.0.1:8099/
```

## Struktur

```
index.html              satu halaman
assets/site.css         token, tata letak, responsif, motion
assets/site.js          POS interaktif, reservasi, nav mobile, reveal
assets/*.jpg            foto berlisensi CC (lihat Kredit)
assets/favicon.svg      favicon
BRIEF.md                ringkasan produk & audiens
```

## Arah desain

Dibangun mengikuti skill **`design-taste-frontend`** (tasteskill v2).

- **Arah undian:** `product-performs` — seed `504905695`
  *Software paling meyakinkan saat sedang bekerja di depan Anda.*
  Fragmen antarmuka sungguhan, bukan tangkapan layar, bukan kartu ikon.
- **Palet:** "Stone and blueprint" — satu-satunya redraw dari undian, karena brief
  menetapkan tema terang dan palet bawaan arah ini gelap.
- **Tipografi:** League Spartan 700 (display) + Figtree (teks), maksimal 5 peran ukuran.
- **Aturan rumah yang dipatuhi:** tanpa gradient dekoratif, tanpa shadow pada elemen diam,
  tanpa garis rambut, tanpa eyebrow label, tanpa penomoran 01/02/03, tanpa kartu ikon,
  tanpa glass. Satu warna aksen (biru `#2456d6`) untuk aksi.

## Yang benar-benar bekerja

Bukan animasi dekoratif — interaksi nyata di halaman:

- **Kasir** — ketuk menu, total dihitung, dan **stok bahan di bagian lain ikut berkurang**.
  Stok menipis mengubah warna baris dan labelnya. "Kirim ke dapur" memunculkan tiket baru
  di strip layar dapur dengan nomor urut yang benar.
- **Denah meja** — memilih meja kosong; meja terisi menolak klik.
- **Nav mobile** — drawer buka/tutup, menutup otomatis setelah tautan diklik.
- **Tanpa JavaScript** — seluruh isi tetap terbaca; kelas `.reveal` hanya disembunyikan
  bila `IntersectionObserver` tersedia.
- **`prefers-reduced-motion`** — semua gerak dimatikan, isi tetap tampil.

## Sumber data

Nama menu dan harga diambil dari database **staging** Wawi Kadio (`menu_items`):
Nasi Goreng Roa 25.000, Goroho Stick 25 25.000, Kentang Goreng 18.000,
Kopi Susu Besar 15.000, Jus Alpukat 15.000.

Angka menu terlaris (Goroho Stick 139, Aqua 600 ml 133, Pop Mie Soto 103) dan
jumlah pesanan (853) dihitung dari `food_orders` / `food_order_items` staging.

> Angka-angka itu berasal dari data uji, **bukan** volume produksi. Ganti sebelum
> dipakai sebagai klaim pemasaran.

## Responsif

Diuji pada 320 / 360 / 390 / 430 / 768 / 1440 px.

- Nol overflow horizontal di keempat lebar HP.
- Semua target sentuh ≥ 44×44 px (diukur lewat DOM, bukan perkiraan).
- Di bawah 720 px tabel harga berubah menjadi kartu bertumpuk, bukan gulir menyamping.
- Headline maksimal dua baris di setiap lebar.

## Pemeriksaan

```bash
# gate desain (butuh Chrome; sebagai root pakai wrapper --no-sandbox)
CHROME_PATH=/root/bin/chrome-nosandbox \
  node ~/.agents/skills/design-taste-frontend/scripts/lint.mjs index.html

# pengukuran di browser nyata: 1440 / 768 / 390
CHROME_PATH=/root/bin/chrome-nosandbox \
  node ~/.agents/skills/design-taste-frontend/scripts/inspect.mjs index.html

# tes fungsi (17 pemeriksaan)
node test-func.mjs      # lokal
node test-live.mjs      # terhadap URL produksi
```

Status terakhir: `lint` 0 FAIL, `inspect` 0 FAIL / 2 WARN, `test-func` 17/17 PASS.

Dua WARN yang dibiarkan sadar:

1. **11 ukuran font** — fragmen antarmuka memakai ukuran aslinya (13–15 px), terpisah
   dari skala halaman. Ini disengaja; menyatukannya membuat fragmen tidak terbaca.
2. **Tanpa video** — tidak ada klip berlisensi tentang dapur Minahasa. Foto diam lebih
   jujur daripada stok yang berpura-pura.

## Kredit foto

Keduanya diunduh dari koleksi terbuka dan dikreditkan di halaman.

- **"Pagi di Danau Tondano"** — Mardiansyah Nugraha, CC BY-SA 4.0,
  via [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?curid=60272334)
- **"Warung Bu Tika"** — Mx. Granger, CC0,
  via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Warung_Bu_Tika.jpg)

Foto menunjukkan dunia sekitar pelanggan, bukan produk atau pelanggan Yersolid.

## Sebelum dipakai produksi

- Alamat email `halo@yersolid.web.id` pada tombol paket dan penutup bersifat sementara —
  ganti dengan alamat dan alur pendaftaran yang sebenarnya.
- Harga (Starter 150rb / Professional 300rb / Enterprise 500rb per outlet) perlu
  dikonfirmasi terhadap skema komersial final.
- Halaman tidak memiliki backend. Formulir pendaftaran belum ada.
