/* ============================================================
   Motion layer — GSAP 3.13 + ScrollTrigger (self-hosted).
   Prinsip (gsap-performance): hanya transform & opacity,
   will-change hanya pada elemen yang benar-benar bergerak,
   semua gerak tunduk pada prefers-reduced-motion.
   Tanpa GSAP, halaman tetap terbaca penuh (fallback CSS).
   ============================================================ */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ok = !reduce && window.gsap && window.ScrollTrigger;

  // --- tanpa animasi: pastikan semua isi terlihat, lalu berhenti
  if (!ok) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    document.documentElement.classList.add('no-motion');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });

  /* ---------------- 1. hero: satu timeline masuk ---------------- */
  const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  heroTl
    .from('.hero-copy .display', { y: 34, opacity: 0, duration: 1.05 })
    .from('.hero-copy .lead', { y: 24, opacity: 0, duration: 0.85 }, '-=0.78')
    .from('.hero-actions > *', { y: 18, opacity: 0, duration: 0.7, stagger: 0.09 }, '-=0.6')
    .from('.hero-note', { y: 12, opacity: 0, duration: 0.6 }, '-=0.5')
    .from('.hero-facts > div', { y: 20, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.45')
    .from('.pos', { y: 40, opacity: 0, scale: 0.97, duration: 1.1 }, '-=1.05')
    .from('.pos-kds .kds-ticket', { x: -14, opacity: 0, duration: 0.5, stagger: 0.09 }, '-=0.55')
    .from('.kds-ticket[data-state="new"]', { scale: 0.9, duration: 0.45 }, '-=0.4');

  // nav turun halus
  gsap.from('.nav .wrap > *', { y: -14, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power2.out' });

  /* ---------------- 2. reveal per bagian (bukan satu fade) ---------------- */
  document.querySelectorAll('.band, .photo-band, .closing').forEach((section) => {
    const head = section.querySelector('.head, .display, .foot-name');
    const bodies = section.querySelectorAll('.body, .lead, .faq-list, .stages, .price-wrap, .price-note');
    const media = section.querySelectorAll('.row-media, .frag, .photo-band h2');

    const targets = [];
    if (head) targets.push(head);
    bodies.forEach((b) => targets.push(b));
    media.forEach((m) => targets.push(m));
    if (!targets.length) return;

    gsap.from(targets, {
      y: 26,
      opacity: 0,
      duration: 0.85,
      stagger: 0.075,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 82%',
        once: true,
      },
    });
  });

  /* ---------------- 3. foto band: parallax lembut ---------------- */
  document.querySelectorAll('.photo-band').forEach((band) => {
    gsap.fromTo(
      band,
      { backgroundPositionY: '38%' },
      {
        backgroundPositionY: '72%',
        ease: 'none',
        scrollTrigger: {
          trigger: band,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      }
    );
  });

  /* ---------------- 4. angka menghitung naik ---------------- */
  const countUp = (el) => {
    const raw = el.textContent.trim();
    // ambil awalan & angka (Rp 4.000 / 127 / Rp 25k / 853)
    const m = raw.match(/^(Rp\s?)?([\d.]+)(\s?[a-zA-Z]*)$/);
    if (!m) return;
    const prefix = m[1] || '';
    const suffix = m[3] || '';
    const target = parseInt(m[2].replace(/\./g, ''), 10);
    if (!Number.isFinite(target)) return;

    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.15,
      ease: 'power2.out',
      onUpdate() {
        el.textContent = prefix + Math.round(obj.v).toLocaleString('id-ID') + suffix;
      },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  };
  // Hanya angka statis (laporan contoh, label lama). Total kasir, angka
  // alur cerita, dan bar terlaris dikelola site.js/story.js — kalau
  // dianimasikan di sini, angkanya bisa berhenti di nilai antara.
  document.querySelectorAll('.fig-v').forEach((el) => {
    const live = ['story-day-total', 'story-day-count'];
    if (live.includes(el.id)) return;
    if (el.closest('#pos-total')) return;
    countUp(el);
  });

  /* ---------------- 5. bar laporan tumbuh berurutan ---------------- */
  const bars = document.querySelectorAll('.bar-fill');
  if (bars.length) {
    gsap.from(bars, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 0.85,
      stagger: 0.11,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.bars', start: 'top 86%', once: true },
    });
  }

  /* ---------------- 6. harga: baris muncul bertahap ---------------- */
  const priceRows = document.querySelectorAll('.price-table tbody tr');
  if (priceRows.length) {
    gsap.from(priceRows, {
      y: 16,
      opacity: 0,
      duration: 0.6,
      stagger: 0.045,
      scrollTrigger: { trigger: '.price-table', start: 'top 80%', once: true },
    });
  }

  /* ---------------- 7. FAQ: buka/tutup halus ---------------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const body = item.querySelector('.faq-body');
    if (!body) return;
    if (!item.open) gsap.set(body, { height: 0, opacity: 0, overflow: 'hidden' });

    item.addEventListener('toggle', () => {
      const isOpen = item.open;
      if (isOpen) {
        gsap.to(body, { height: 'auto', opacity: 1, duration: 0.38, ease: 'power2.out' });
        gsap.fromTo(item.querySelector('summary'), { backgroundColor: 'rgba(176,41,143,0)' }, { backgroundColor: 'rgba(176,41,143,0.06)', duration: 0.3 });
      } else {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.28, ease: 'power2.in' });
      }
    });
  });

  /* ---------------- 8. POS: tiket masuk dengan gerak ---------------- */
  const kds = document.getElementById('pos-kds');
  if (kds) {
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          gsap.fromTo(
            n,
            { x: -18, opacity: 0, scale: 0.9 },
            { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
          );
        });
      });
    });
    mo.observe(kds, { childList: true });
  }

  // baris pesanan baru
  const lines = document.getElementById('pos-lines');
  if (lines) {
    const mo2 = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          gsap.fromTo(n, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
        });
      });
    });
    mo2.observe(lines, { childList: true });
  }

  // total berdenyut saat berubah
  const totalEl = document.getElementById('pos-total');
  if (totalEl) {
    const mo3 = new MutationObserver(() => {
      gsap.fromTo(totalEl, { scale: 1 }, { scale: 1.06, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' });
    });
    mo3.observe(totalEl, { childList: true, characterData: true, subtree: true });
  }

  /* ---------------- 9. meja reservasi: pilih dengan pegas ---------------- */
  const resvGrid = document.getElementById('resv-grid');
  if (resvGrid) {
    resvGrid.addEventListener('click', (e) => {
      const slot = e.target.closest('.resv-slot');
      if (!slot) return;
      if (slot.dataset.state === 'picked') {
        gsap.fromTo(slot, { scale: 1 }, { scale: 1.08, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.out' });
      }
    });
  }

  /* ---------------- 10. kartu media: reaksi pointer halus ---------------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-ui]').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power3' });
      const ty = gsap.quickTo(card, 'y', { duration: 0.5, ease: 'power3' });

      card.style.transformPerspective = '900px';
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 5);
        rx(-py * 5);
        ty(-3);
      });
      card.addEventListener('pointerleave', () => {
        rx(0);
        ry(0);
        ty(0);
      });
    });
  }

  /* ---------------- 11. nav: menyusut setelah scroll ---------------- */
  ScrollTrigger.create({
    start: 'top -70',
    onUpdate: (self) => {
      const nav = document.querySelector('.nav');
      if (!nav) return;
      gsap.to(nav, {
        paddingBlock: self.direction === 1 && self.progress > 0 ? 8 : 14,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: true,
      });
    },
  });

  /* ---------------- 12. tombol: umpan balik tekan ---------------- */
  document.querySelectorAll('.btn, .nav-cta, .pos-pay, .pick').forEach((btn) => {
    btn.addEventListener('pointerdown', () => gsap.to(btn, { scale: 0.97, duration: 0.1 }));
    btn.addEventListener('pointerup', () => gsap.to(btn, { scale: 1, duration: 0.22, ease: 'back.out(2)' }));
    btn.addEventListener('pointerleave', () => gsap.to(btn, { scale: 1, duration: 0.18 }));
  });

  /* ---------------- 13. judul penutup: kata demi kata ---------------- */
  const closing = document.querySelector('.closing .display');
  if (closing) {
    const words = closing.textContent.trim().split(/\s+/);
    closing.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.textContent = w;
      span.style.display = 'inline-block';
      closing.appendChild(span);
      if (i < words.length - 1) closing.appendChild(document.createTextNode(' '));
    });
    gsap.from(closing.children, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.06,
      ease: 'expo.out',
      scrollTrigger: { trigger: closing, start: 'top 84%', once: true },
    });
  }

  // refresh setelah font & gambar selesai, supaya posisi trigger benar
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
