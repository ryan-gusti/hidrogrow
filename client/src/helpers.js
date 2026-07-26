// Helper tanggal, ikon, & notifikasi lokal (Bahasa Indonesia) — design system Anthropic
export const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const HARI_PANJANG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function todayStr() { return toStr(new Date()); }

export function toStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s) { return new Date(s + 'T00:00:00'); }

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}

export function formatId(s) {
  const d = parseDate(s);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatLong(s) {
  const d = parseDate(s);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatShort(s) {
  const d = parseDate(s);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function monthYear(s) {
  const d = parseDate(s);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export function numID(n) { return (n ?? 0).toLocaleString('id-ID'); }
export function kg(g) { return (g / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }); }
export function rupiah(n) { return 'Rp ' + (n || 0).toLocaleString('id-ID'); }
export function comma(n) { return String(n == null ? '' : n).replace('.', ','); }

// Event meta sesuai design: cls badge + col (css var untuk dot/bar)
export const EVENT_META = {
  semai: { label: 'Semai', cls: 'b-semai', col: 'var(--ev-semai)' },
  pindah: { label: 'Pindah tanam', cls: 'b-pindah', col: 'var(--ev-pindah)' },
  cek_nutrisi: { label: 'Cek nutrisi', cls: 'b-cek', col: 'var(--ev-cek)' },
  ganti_larutan: { label: 'Ganti larutan', cls: 'b-cek', col: 'var(--ev-cek)' },
  panen: { label: 'Panen', cls: 'b-panen', col: 'var(--ev-panen)' },
  bersih_tandon: { label: 'Bersihkan tandon', cls: 'b-muted', col: 'var(--meta)' },
  lainnya: { label: 'Lainnya', cls: 'b-muted', col: 'var(--meta)' },
};

export const SYSTEM_TYPES = [
  { value: 'wick', label: 'Sistem Wick (Sumbu)' },
  { value: 'nft', label: 'NFT' },
  { value: 'dft', label: 'DFT (Rakit Apung Dalam)' },
  { value: 'rakit_apung', label: 'Rakit Apung' },
  { value: 'drip', label: 'Drip (Tetes)' },
  { value: 'lainnya', label: 'Lainnya' },
];

export function systemLabel(v) {
  return (SYSTEM_TYPES.find((t) => t.value === v) || {}).label || v;
}

// Ikon SVG inline (stroke, mengikuti gaya design)
export const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5s5.5 6.2 5.5 10a5.5 5.5 0 0 1-11 0c0-3.8 5.5-10 5.5-10Z"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5 4 9l4 4"/><path d="M4 9h9a6 6 0 0 1 0 12h-3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4.5 0-7.5-3-7.5-7.5C4.5 7.5 9 4 16 3.5c.8 5-1 9.5-4 12.5"/><path d="M12 21c0-5 1.5-8.5 5-11"/></svg>',
  navToday: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1.2 1.2L7.5 5M4 12l1.2 1.2L7.5 11M4 18l1.2 1.2L7.5 17"/></svg>',
  navCal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  navGrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 13c0-4 3-6.5 8-6.5 0 4-3 6.5-8 6.5Z"/><path d="M12 10C12 7 9.5 5 6 5c0 3 2.5 5 6 5Z"/></svg>',
  navLog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5s5.5 6.2 5.5 10a5.5 5.5 0 0 1-11 0c0-3.8 5.5-10 5.5-10Z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/></svg>',
  navReport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-5M12 16V8.5M16 16v-3M20 16V6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0 4-4m-4 4-4-4"/><path d="M5 20h14"/></svg>',
};

// --- Lightbox global: klik foto untuk perbesar ---
export function openLightbox(url, alt = '') {
  if (!url) return;
  window.dispatchEvent(new CustomEvent('hg:lightbox', { detail: { url, alt } }));
}

// --- Notifikasi lokal (tanpa push server) ---
export async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function notifyDailyTasks(count) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || count === 0) return;
  const key = 'hg_notif_date';
  if (localStorage.getItem(key) === todayStr()) return;
  localStorage.setItem(key, todayStr());
  new Notification('HidroGrow 🌱', {
    body: `${count} tugas hari ini di kebunmu`,
    icon: '/icon.svg',
    tag: 'daily-tasks',
  });
}
