/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bukan 'export': kita butuh API route. Landing tetap dirender statis
  // (semua bagian server component), jadi pengunjung menerima HTML penuh.
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
