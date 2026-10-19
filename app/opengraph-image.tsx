import { ImageResponse } from 'next/og';

/* Gambar pratinjau saat tautan dibagikan di WhatsApp/Telegram/X.
   Dibuat dinamis supaya teksnya ikut berubah kalau judul diganti —
   tidak ada berkas PNG yang harus diingat untuk diperbarui. */

export const alt = 'Yersolid Tech — kasir, dapur, dan laporan dalam satu alur';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f7f2ea',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: '#e8501f',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            Y
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#1c1a17' }}>Yersolid Tech</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0 18px',
              fontSize: 82,
              fontWeight: 800,
              color: '#1c1a17',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: 940,
            }}
          >
            <span>Satu ketukan di kasir,</span>
            <span style={{ color: '#e8501f' }}>stok ikut berkurang.</span>
          </div>
          <div style={{ fontSize: 32, color: '#6b655b', maxWidth: 820 }}>
            Tiket muncul di dapur, laporan terisi sendiri. Mulai Rp 150.000/bulan.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, fontSize: 26, color: '#6b655b' }}>
          <span>Kasir</span>
          <span>·</span>
          <span>Layar dapur</span>
          <span>·</span>
          <span>Stok</span>
          <span>·</span>
          <span>Laporan</span>
        </div>
      </div>
    ),
    size,
  );
}
