/* ============================================================
   Story flow — satu pesanan berjalan dari kasir sampai laporan.
   Keadaan disimpan di window.YT_STORY supaya section lain
   (dapur, stok, laporan) bereaksi pada pesanan yang sama.
   Tanpa JS / tanpa GSAP: semua tampil di keadaan awal yang masuk akal.
   ============================================================ */
(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STAGES = ['masuk', 'masak', 'siap', 'selesai'];

  const story = {
    ticket: null,        // { no, items:[{name,qty,price}], total }
    stage: 'masuk',      // masuk -> masak -> siap -> selesai
    orders: [],          // semua pesanan pada hari itu
    listeners: [],
    on(fn) { this.listeners.push(fn); fn(this); },
    emit() { this.listeners.forEach((fn) => fn(this)); },
    push(order) {
      this.ticket = order;
      this.stage = 'masuk';
      this.orders.push({ ...order, stage: 'masuk', at: Date.now() });
      this.emit();
    },
    advance(to) {
      if (!this.ticket) return;
      this.stage = to;
      const rec = this.orders.find((o) => o.no === this.ticket.no);
      if (rec) rec.stage = to;
      this.emit();
    },
  };

  window.YT_STORY = story;

  /* ---------------- tampilan dapur (section #kasir/dapur) ---------------- */
  const kdsPanel = document.getElementById('story-kds');
  const kdsList = document.getElementById('story-kds-list');
  const kdsEmpty = document.getElementById('story-kds-empty');
  const stageLabel = document.getElementById('story-stage');
  const kdsTotal = document.getElementById('story-kds-total');

  const STAGE_TEXT = {
    masuk: 'Pesanan baru masuk',
    masak: 'Sedang dimasak',
    siap: 'Siap diantar',
    selesai: 'Selesai',
  };
  // label duduk di atas navy: warna terang (>= 4.5:1) DAN sama dengan
  // warna titik di legenda, supaya satu tahap = satu warna.
  const STAGE_COLOR = {
    masuk: '#9fd0f5',   // biru  = tiket masuk
    masak: '#c9b6f5',   // ungu  = sedang dimasak
    siap: '#9be3c0',    // hijau = siap diantar
    selesai: '#cbe4f2', // langit = selesai
  };

  const renderKds = () => {
    if (!kdsList) return;
    if (!story.ticket) {
      if (kdsEmpty) kdsEmpty.hidden = false;
      kdsList.innerHTML = '';
      if (stageLabel) stageLabel.textContent = 'Menunggu pesanan';
      if (kdsTotal) kdsTotal.textContent = 'Rp 0';
      return;
    }
    if (kdsEmpty) kdsEmpty.hidden = true;

    kdsList.innerHTML = story.ticket.items
      .map(
        (it) => `
        <div class="kds-item" data-stage="${story.stage}">
          <span class="kds-name">${it.name}</span>
          <span class="kds-qty">×${it.qty}</span>
          <span class="kds-bar"><span class="kds-bar-fill"></span></span>
        </div>`
      )
      .join('');

    if (stageLabel) {
      stageLabel.textContent = `#${story.ticket.no} — ${STAGE_TEXT[story.stage]}`;
      stageLabel.style.color = STAGE_COLOR[story.stage];
    }
    const badge = document.getElementById('story-new-badge');
    if (badge) {
      const isNew = story.stage === 'masuk';
      badge.classList.toggle('on', isNew);
    }
    if (kdsTotal) kdsTotal.textContent = 'Rp ' + story.ticket.total.toLocaleString('id-ID');

    // animasi masak: bar mengisi sesuai tahap
    if (window.gsap && !reduce) {
      const fills = kdsList.querySelectorAll('.kds-bar-fill');
      const pct = { masuk: 12, masak: 62, siap: 100, selesai: 100 }[story.stage];
      gsap.fromTo(fills, { scaleX: 0 }, { scaleX: pct / 100, transformOrigin: 'left center', duration: 0.7, stagger: 0.07, ease: 'power2.out' });
      gsap.fromTo(
        kdsList.querySelectorAll('.kds-item'),
        { y: 10, opacity: 0.4 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out' }
      );
    }
  };

  // jalur tahap (.rail-step) dikelola proses.js

  story.on((st) => {
    if (st.stage !== 'masuk' || !kdsList) return;
    kdsList.querySelectorAll('.kds-item').forEach((el) => el.classList.add('is-new'));
    setTimeout(() => kdsList.querySelectorAll('.kds-item').forEach((el) => el.classList.remove('is-new')), 1600);
  });

  story.on(renderKds);

  /* ---------------- laporan ikut terisi ---------------- */
  const dayCount = document.getElementById('story-day-count');

  const dayBars = document.getElementById('story-day-bars');

  const renderReport = () => {
    if (!dayCount) return;
    const baseCount = 0;
    const baseTotal = 0;
    const n = baseCount + story.orders.length;
    const t = baseTotal + story.orders.reduce((a, o) => a + o.total, 0);
    dayCount.textContent = String(n);
    const rvEl = document.getElementById('report-value');
    if (rvEl) rvEl.textContent = 'Rp ' + t.toLocaleString('id-ID');

    if (!dayBars) return;
    // menu terlaris = gabungan item dari pesanan story + dasar
    const tally = new Map([
      ['Goroho Stick', 139],
      ['Aqua 600 ml', 133],
      ['Pop Mie Soto', 103],
    ]);
    story.orders.forEach((o) => o.items.forEach((it) => {
      tally.set(it.name, (tally.get(it.name) || 0) + it.qty);
    }));
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const max = top[0] ? top[0][1] : 1;

    dayBars.innerHTML = top
      .map(
        ([name, q]) => `
        <div class="bar-row">
          <span>${name}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${Math.round((q / max) * 100)}%"></span></span>
          <span class="bar-val">${q}</span>
        </div>`
      )
      .join('');

    if (window.gsap && !reduce) {
      gsap.fromTo(
        dayBars.querySelectorAll('.bar-fill'),
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: 'left center', duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );
    }
  };

  // pertama kali pesanan masuk, laporan langsung terisi
  story.on(() => {
    if (!document.getElementById('story-day-count')) return;
    const n = story.orders.length;
    const tot = story.orders.reduce((a, o) => a + o.total, 0);
    document.getElementById('story-day-count').textContent = String(n);
    const rv = document.getElementById('report-value');
    const ra = document.getElementById('report-avg');
    const rs = document.getElementById('report-sent');
    if (rv) rv.textContent = 'Rp 0';
    if (ra) ra.textContent = 'Rp ' + (n ? Math.round(tot / n).toLocaleString('id-ID') : '0');
    if (rs) rs.textContent = String(n);
    renderReport();
  });

  /* ---------------- tombol tahap di tampilan dapur ---------------- */
  const advanceBtn = document.getElementById('story-advance');
  if (advanceBtn) {
    const LABEL = {
      masuk: 'Mulai masak',
      masak: 'Tandai siap',
      siap: 'Selesaikan',
      selesai: 'Selesai',
    };
    story.on(() => {
      advanceBtn.textContent = LABEL[story.stage] || 'Lanjut';
      advanceBtn.disabled = story.stage === 'selesai' || !story.ticket;
    });
    advanceBtn.addEventListener('click', () => {
      const i = STAGES.indexOf(story.stage);
      if (i >= 0 && i < STAGES.length - 1) story.advance(STAGES[i + 1]);
    });
  }

  /* ---------------- pemicu otomatis saat scroll ---------------- */
  // Pemicu dibuat SAAT pesanan masuk, bukan saat halaman dimuat: kalau dibuat
  // lebih awal, `once` sudah terpakai sebelum ada pesanan, dan tahap tak maju.
  if (window.ScrollTrigger && !reduce) {
    let armed = null;

    story.on(() => {
      if (armed || !story.ticket) return;
      armed = true;

      const kdsSection = document.getElementById('dapur');
      if (kdsSection) {
        ScrollTrigger.create({
          trigger: kdsSection,
          start: 'top 75%',
          once: true,
          onEnter: () => {
            if (story.stage === 'masuk') setTimeout(() => story.advance('masak'), 600);
          },
        });
      }
      const reportSection = document.getElementById('laporan');
      if (reportSection) {
        ScrollTrigger.create({
          trigger: reportSection,
          start: 'top 75%',
          once: true,
          onEnter: () => {
            if (story.stage === 'masak') story.advance('siap');
          },
        });
      }
      ScrollTrigger.refresh();
    });
  }
})();
