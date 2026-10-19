import type { MetadataRoute } from 'next';

/* coba.yersolid.web.id adalah preview — JANGAN diindeks mesin pencari.
   Saat pindah ke saas.yersolid.web.id, ganti allow menjadi '/' dan
   tambahkan sitemap, supaya halaman bisa ditemukan. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
    sitemap: 'https://coba.yersolid.web.id/sitemap.xml',
  };
}
