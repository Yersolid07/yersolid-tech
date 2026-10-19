import type { MetadataRoute } from 'next';

/* Sitemap: satu halaman publik. Kalau nanti ada /harga terpisah atau /blog,
   tambahkan di sini — bukan dibuat otomatis dari rute, karena /api tidak
   boleh masuk sitemap. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://coba.yersolid.web.id';
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
