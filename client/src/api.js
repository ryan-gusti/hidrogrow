// Wrapper fetch dengan token + antrean offline untuk form log (offline-first)
const TOKEN_KEY = 'hg_token';
const QUEUE_KEY = 'hg_offline_queue';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

function queueable(method, url) {
  return method === 'POST' && ['/api/logs', '/api/harvests', '/api/notes'].some((p) => url.startsWith(p));
}

function pushQueue(item) {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  q.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function queueCount() {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length;
}

export async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (!q.length) return 0;
  const remaining = [];
  let flushed = 0;
  for (const item of q) {
    try {
      await api(item.method, item.url, item.body, { skipQueue: true });
      flushed++;
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return flushed;
}

export async function api(method, url, body, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
  } catch (err) {
    // Offline: antrekan input log agar disinkronkan saat online
    if (!opts.skipQueue && queueable(method, url)) {
      pushQueue({ method, url, body });
      return { queued: true };
    }
    throw new Error('Tidak dapat terhubung ke server');
  }
  if (res.status === 401 && !url.startsWith('/api/auth/')) {
    setToken(null);
    // Hindari reload berulang jika sudah di halaman login
    if (!window.location.pathname.startsWith('/login')) {
      window.location.replace('/login');
    }
    throw new Error('Sesi berakhir, silakan masuk kembali');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `Kesalahan server (${res.status})`);
  return data;
}

export async function uploadPhoto(file) {
  // Kompresi sisi klien sebelum upload
  const blob = await compressImage(file);
  const form = new FormData();
  form.append('photo', blob, file.name || 'foto.jpg');
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal mengunggah foto');
  return data.url;
}

function compressImage(file, maxSize = 1280, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      if (scale === 1 && file.size < 300 * 1024) return resolve(file);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

// Sinkronkan antrean saat kembali online
window.addEventListener('online', () => flushQueue());
