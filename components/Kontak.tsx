'use client';

import { useState } from 'react';

/* ============================================================
   FORMULIR KONTAK — menggantikan mailto: yang tidak memberi umpan balik.
   Empat keadaan yang harus ada: kosong, mengirim, gagal, berhasil.
   ============================================================ */

type Status = 'diam' | 'kirim' | 'ok' | 'gagal';

export function Kontak() {
  const [status, setStatus] = useState<Status>('diam');
  const [pesan, setPesan] = useState('');

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('kirim');
    setPesan('');

    const fd = new FormData(e.currentTarget);
    const isi = {
      nama: String(fd.get('nama') ?? ''),
      email: String(fd.get('email') ?? ''),
      usaha: String(fd.get('usaha') ?? ''),
      pesan: String(fd.get('pesan') ?? ''),
    };

    try {
      const r = await fetch('/api/kontak/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isi),
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setStatus('ok');
        setPesan(j.pesan);
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus('gagal');
        setPesan(j.pesan ?? 'Gagal mengirim.');
      }
    } catch {
      setStatus('gagal');
      setPesan('Jaringan bermasalah. Coba lagi, atau email halo@yersolid.web.id.');
    }
  }

  const kolom =
    'min-h-[48px] w-full rounded-[14px] bg-bg px-4 text-[1rem] text-ink placeholder:text-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue';

  return (
    <section id="kontak" className="scroll-mt-24 bg-surface-2 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-[1120px] px-5">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="max-w-[22ch] text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold">
              Minta akses coba.
            </h2>
            <p className="mt-3 max-w-[42ch] text-muted">
              Tulis nama warung atau restoran Anda. Kami siapkan akun dengan
              menu Anda sendiri, gratis 14 hari.
            </p>
            <p className="mt-5 text-[0.9375rem] text-muted">
              Atau email langsung:{' '}
              <a href="mailto:halo@yersolid.web.id" className="inline-flex min-h-[44px] items-center font-semibold text-ink underline decoration-acc decoration-2 underline-offset-2">
                halo@yersolid.web.id
              </a>
            </p>
          </div>

          <form onSubmit={kirim} className="rounded-[20px] bg-surface p-5 sm:p-6" noValidate>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[0.875rem] font-semibold">Nama</span>
                <input name="nama" required maxLength={80} autoComplete="name" className={kolom} placeholder="Nama Anda" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.875rem] font-semibold">Email</span>
                <input name="email" type="email" required maxLength={160} autoComplete="email" inputMode="email" className={kolom} placeholder="nama@email.com" />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-[0.875rem] font-semibold">Nama usaha</span>
              <input name="usaha" maxLength={80} autoComplete="organization" className={kolom} placeholder="Warung, kafe, atau restoran" />
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-[0.875rem] font-semibold">
                Pesan <span className="font-normal text-muted">(opsional)</span>
              </span>
              <textarea name="pesan" rows={3} maxLength={1200} className={kolom + ' py-3 leading-normal'} placeholder="Berapa outlet, berapa menu?" />
            </label>

            <button
              type="submit"
              disabled={status === 'kirim'}
              className="mt-4 min-h-[52px] w-full rounded-full bg-acc px-6 font-bold text-white transition-colors hover:bg-acc-deep disabled:cursor-wait disabled:bg-line disabled:text-muted"
            >
              {status === 'kirim' ? 'Mengirim…' : 'Kirim permintaan'}
            </button>

            {/* umpan balik: aria-live supaya pembaca layar ikut tahu */}
            <p
              role="status"
              aria-live="polite"
              className={[
                'mt-3 text-[0.875rem]',
                status === 'ok' ? 'font-semibold text-ok' : status === 'gagal' ? 'font-semibold text-acc-deep' : 'text-muted',
              ].join(' ')}
            >
              {status === 'ok' && '✓ '}
              {pesan || 'Kami balas dalam 1 hari kerja.'}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
