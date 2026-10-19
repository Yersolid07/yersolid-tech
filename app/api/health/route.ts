import { NextResponse } from 'next/server';

/* ============================================================
   KESEHATAN SISTEM — dipakai pemeriksa uptime.
   Sengaja hanya mengembalikan status, TANPA detail versi, path, atau
   nama basis data: informasi itu berguna untuk penyerang.
   ============================================================ */

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', waktu: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
