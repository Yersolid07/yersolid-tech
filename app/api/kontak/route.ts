import { NextResponse } from 'next/server';

/* ============================================================
   API kontak — satu endpoint, tanpa dependency.
   Kenapa ada: formulir mailto: tidak memberi tahu apakah pengirim
   berhasil atau gagal. Endpoint ini memvalidasi di sisi server
   (batas kepercayaan) dan mencatat permintaan.

   Penyimpanan: berkas JSONL di data/lead.jsonl. Cukup untuk volume
   landing page. Naikkan ke SQLite/Postgres kalau sudah >1000/hari.
   ============================================================ */

const BATAS_NAMA = 80;
const BATAS_PESAN = 1200;

type Masukan = { nama?: unknown; email?: unknown; usaha?: unknown; pesan?: unknown };

const emailSah = (s: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s);

export async function POST(req: Request) {
  let data: Masukan;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, pesan: 'Format tidak dikenali.' }, { status: 400 });
  }

  const nama = String(data.nama ?? '').trim();
  const email = String(data.email ?? '').trim().toLowerCase();
  const usaha = String(data.usaha ?? '').trim().slice(0, BATAS_NAMA);
  const pesan = String(data.pesan ?? '').trim().slice(0, BATAS_PESAN);

  // validasi di batas kepercayaan
  if (nama.length < 1 || nama.length > BATAS_NAMA) {
    return NextResponse.json({ ok: false, pesan: 'Nama wajib diisi, maksimal 80 huruf.' }, { status: 422 });
  }
  if (!emailSah(email) || email.length > 160) {
    return NextResponse.json({ ok: false, pesan: 'Alamat email tidak valid.' }, { status: 422 });
  }

  const baris = JSON.stringify({
    waktu: new Date().toISOString(),
    nama,
    email,
    usaha,
    pesan,
    ip: req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? null,
  });

  try {
    const { appendFile, mkdir } = await import('node:fs/promises');
    await mkdir('data', { recursive: true });
    await appendFile('data/lead.jsonl', baris + '\n', 'utf8');
  } catch (e) {
    console.error('gagal menyimpan lead', e);
    return NextResponse.json({ ok: false, pesan: 'Gagal menyimpan. Coba lagi.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pesan: 'Terima kasih. Kami balas dalam 1 hari kerja.' });
}
