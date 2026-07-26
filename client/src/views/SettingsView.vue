<template>
  <div>
    <div class="page-head"><h1>Pengaturan</h1></div>

    <div class="card" style="padding:16px;margin-bottom:16px">
      <div class="sec-head" style="margin:0 0 12px"><h2 style="font-size:18px">👤 Profil</h2></div>
      <div class="field"><label>Nama</label>
        <div style="display:flex;gap:8px">
          <input v-model="name" type="text" style="flex:1" />
          <button class="btn btn-secondary" :disabled="!name.trim() || name === auth.user?.name" @click="saveName">Simpan</button>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted)">@{{ auth.user?.username }}</p>
    </div>

    <div class="card" style="padding:16px;margin-bottom:16px">
      <div class="sec-head" style="margin:0 0 12px"><h2 style="font-size:18px">🏡 Instalasi Saya</h2><span class="sp"></span><button class="btn btn-ghost btn-sm" @click="editing = {}; instForm = true">+ Tambah</button></div>
      <div v-for="i in auth.installations" :key="i.id" style="border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;margin-bottom:8px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <p style="font-weight:500">{{ i.name }}</p>
            <p style="font-size:12px;color:var(--muted)">{{ systemLabel(i.system_type) }} · {{ i.capacity }} lubang · {{ comma(i.reservoir_volume) }} L</p>
          </div>
          <div style="display:flex;gap:4px">
            <button class="icon-btn" @click="editing = i; instForm = true">✏️</button>
            <button class="icon-btn" @click="removeInst(i)">🗑</button>
          </div>
        </div>
        <div v-if="i.capacity > 0" style="margin-top:8px">
          <div style="display:flex;height:6px;border-radius:99px;background:var(--surface-warm);overflow:hidden">
            <div style="background:var(--ev-semai)" :style="{ width: pct(i.hole_status?.semai, i.capacity) }"></div>
            <div style="background:var(--leaf)" :style="{ width: pct(i.hole_status?.vegetatif, i.capacity) }"></div>
            <div style="background:var(--ev-panen)" :style="{ width: pct(i.hole_status?.panen, i.capacity) }"></div>
          </div>
          <p style="font-size:11px;color:var(--meta);margin-top:4px">🟢 semai {{ i.hole_status?.semai || 0 }} · 🔵 vegetatif {{ i.hole_status?.vegetatif || 0 }} · 🟠 siap panen {{ i.hole_status?.panen || 0 }}</p>
        </div>
      </div>
    </div>

    <div class="card" style="padding:16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <h2 style="font-size:18px">🔔 Notifikasi</h2>
        <p style="font-size:12px;color:var(--muted)">Pengingat harian saat aplikasi dibuka.</p>
      </div>
      <button class="btn btn-secondary btn-sm" @click="enableNotif">{{ notifLabel }}</button>
    </div>

    <div class="card" style="padding:16px;margin-bottom:16px">
      <div class="sec-head" style="margin:0 0 12px"><h2 style="font-size:18px">🔑 Ganti Password</h2></div>
      <div class="field"><label>Password saat ini</label><input v-model="pw.current" type="password" autocomplete="current-password" /></div>
      <div class="field"><label>Password baru (min. 6 karakter)</label><input v-model="pw.next" type="password" autocomplete="new-password" /></div>
      <button class="btn btn-secondary" style="width:100%" :disabled="!pw.current || pw.next.length < 6" @click="changePassword">Simpan Password Baru</button>
    </div>

    <div class="card" style="padding:16px;border-color:color-mix(in oklab, var(--danger) 25%, var(--border))">
      <div class="sec-head" style="margin:0 0 12px"><h2 style="font-size:18px;color:var(--danger)">⚠️ Zona Berbahaya</h2></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-secondary" @click="logout">Keluar</button>
        <button class="btn btn-danger" @click="deleting = true">Hapus Akun & Seluruh Data</button>
      </div>
    </div>

    <InstallationForm v-if="instForm" :initial="editing?.id ? editing : null" @close="instForm = false" @saved="onInstSaved" @toast="onToast" />
    <Sheet v-if="deleting" title="Hapus Akun?" @close="deleting = false">
      <p class="sub">Semua data kebun akan dihapus permanen. Akun default dibuat ulang saat server restart.</p>
      <div class="field"><label>Konfirmasi password</label><input v-model="deletePassword" type="password" /></div>
      <button class="btn btn-danger" style="width:100%" @click="deleteAccount">Ya, Hapus Semuanya</button>
    </Sheet>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import { systemLabel, comma, ensureNotificationPermission } from '../helpers';
import InstallationForm from '../components/InstallationForm.vue';
import Sheet from '../components/Sheet.vue';

const router = useRouter();
const auth = useAuthStore();
const name = ref('');
const pw = reactive({ current: '', next: '' });
const instForm = ref(false);
const editing = ref(null);
const deleting = ref(false);
const deletePassword = ref('');
const notifLabel = ref('Aktifkan');

const pct = (n, cap) => `${Math.min(100, ((n || 0) / (cap || 1)) * 100)}%`;

async function saveName() {
  try { const { user } = await api('PUT', '/api/auth/profile', { name: name.value }); auth.user = user; window.dispatchEvent(new CustomEvent('hg:toast', { detail: 'Profil tersimpan.' })); }
  catch (e) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: e.message })); }
}
async function changePassword() {
  try { await api('PUT', '/api/auth/password', { current_password: pw.current, new_password: pw.next }); pw.current = pw.next = ''; window.dispatchEvent(new CustomEvent('hg:toast', { detail: 'Password berhasil diubah.' })); }
  catch (e) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: e.message })); }
}
async function removeInst(i) {
  if (!confirm(`Hapus instalasi "${i.name}" beserta seluruh batch & lognya?`)) return;
  try { await api('DELETE', `/api/installations/${i.id}`); await auth.fetchInstallations(true); window.dispatchEvent(new CustomEvent('hg:toast', { detail: 'Instalasi dihapus.' })); }
  catch (e) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: e.message })); }
}
async function onInstSaved() { instForm.value = false; editing.value = null; await auth.fetchInstallations(true); }
function onToast(m) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: m })); }
async function enableNotif() { const ok = await ensureNotificationPermission(); notifLabel.value = ok ? 'Aktif ✓' : 'Ditolak'; }
function logout() { auth.logout(); router.push('/login'); }
async function deleteAccount() {
  try { await api('DELETE', '/api/auth/account', { password: deletePassword.value }); auth.logout(); router.push('/login'); }
  catch (e) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: e.message })); }
}

onMounted(async () => {
  await auth.fetchInstallations(true);
  name.value = auth.user?.name || '';
  if ('Notification' in window && Notification.permission === 'granted') notifLabel.value = 'Aktif ✓';
});
</script>
