// Helper tanggal & notifikasi lokal (Bahasa Indonesia)
export const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

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
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(s) {
  const d = parseDate(s);
  return `${d.getDate()} ${BULAN[d.getMonth()]}`;
}

export const EVENT_META = {
  semai: { label: 'Semai', dot: 'bg-green-500', chip: 'bg-green-100 text-green-700' },
  pindah: { label: 'Pindah Tanam', dot: 'bg-blue-500', chip: 'bg-blue-100 text-blue-700' },
  cek_nutrisi: { label: 'Cek Nutrisi', dot: 'bg-yellow-500', chip: 'bg-yellow-100 text-yellow-700' },
  ganti_larutan: { label: 'Ganti Larutan', dot: 'bg-red-400', chip: 'bg-red-100 text-red-700' },
  panen: { label: 'Panen', dot: 'bg-orange-500', chip: 'bg-orange-100 text-orange-700' },
  bersih_tandon: { label: 'Bersihkan Tandon', dot: 'bg-purple-500', chip: 'bg-purple-100 text-purple-700' },
  lainnya: { label: 'Lainnya', dot: 'bg-gray-400', chip: 'bg-gray-100 text-gray-700' },
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

// --- Notifikasi lokal (tanpa push server) ---
export async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

// Tampilkan ringkasan tugas harian maksimal 1x per hari
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
