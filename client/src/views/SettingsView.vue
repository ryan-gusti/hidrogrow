<template>
  <div class="space-y-4">
    <!-- Profil -->
    <div class="card space-y-3">
      <h3 class="font-bold">👤 Profil</h3>
      <div>
        <label class="label">Nama</label>
        <div class="flex gap-2">
          <input v-model="name" type="text" class="input flex-1" />
          <button class="btn-secondary" :disabled="!name.trim() || name === auth.user?.name" @click="saveName">Simpan</button>
        </div>
      </div>
      <p class="text-sm text-gray-500">@{{ auth.user?.username }}</p>
    </div>

    <!-- Instalasi -->
    <div class="card space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-bold">🏡 Instalasi Saya</h3>
        <button class="text-sm font-medium text-leaf-600" @click="editing = {}; instForm = true">+ Tambah</button>
      </div>
      <div v-for="i in auth.installations" :key="i.id" class="rounded-xl border border-gray-100 p-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ i.name }}</p>
            <p class="text-xs text-gray-500">{{ systemLabel(i.system_type) }} · {{ i.capacity }} lubang · {{ i.reservoir_volume }} L</p>
          </div>
          <div class="flex gap-1">
            <button class="btn-ghost !min-h-0 p-2" @click="editing = i; instForm = true">✏️</button>
            <button class="btn-ghost !min-h-0 p-2" @click="removeInst(i)">🗑</button>
          </div>
        </div>
        <!-- Visualisasi status lubang -->
        <div v-if="i.capacity > 0" class="mt-2">
          <div class="flex h-3 overflow-hidden rounded-full bg-gray-100" :title="`${usedHoles(i)}/${i.capacity} lubang terpakai`">
            <div class="bg-green-400" :style="{ width: pct(i.hole_status.semai, i.capacity) }" />
            <div class="bg-blue-400" :style="{ width: pct(i.hole_status.vegetatif, i.capacity) }" />
            <div class="bg-orange-400" :style="{ width: pct(i.hole_status.panen, i.capacity) }" />
          </div>
          <p class="mt-1 text-[10px] text-gray-400">
            🟢 semai {{ i.hole_status.semai }} · 🔵 vegetatif {{ i.hole_status.vegetatif }} · 🟠 siap panen {{ i.hole_status.panen }} · kosong {{ Math.max(0, i.capacity - usedHoles(i)) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Notifikasi -->
    <div class="card flex items-center justify-between">
      <div>
        <h3 class="font-bold">🔔 Notifikasi</h3>
        <p class="text-xs text-gray-500">Pengingat harian saat aplikasi dibuka (notifikasi lokal).</p>
      </div>
      <button class="btn-secondary !min-h-0 !py-1.5 text-sm" @click="enableNotif">{{ notifLabel }}</button>
    </div>

    <!-- Ganti password -->
    <div class="card space-y-3">
      <h3 class="font-bold">🔑 Ganti Password</h3>
      <input v-model="pw.current" type="password" class="input" placeholder="Password saat ini" autocomplete="current-password" />
      <input v-model="pw.next" type="password" class="input" placeholder="Password baru (min. 6 karakter)" autocomplete="new-password" />
      <p v-if="pwMsg" class="text-sm" :class="pwOk ? 'text-leaf-600' : 'text-red-600'">{{ pwMsg }}</p>
      <button class="btn-secondary w-full" :disabled="!pw.current || pw.next.length < 6" @click="changePassword">Simpan Password Baru</button>
    </div>

    <!-- Zona berbahaya -->
    <div class="card space-y-3 !border-red-100">
      <h3 class="font-bold text-red-600">⚠️ Zona Berbahaya</h3>
      <button class="btn-secondary w-full" @click="logout">Keluar</button>
      <button class="btn-danger w-full" @click="deleting = true">Hapus Akun & Seluruh Data</button>
    </div>

    <InstallationForm v-if="instForm" :initial="editing?.id ? editing : null" class="!shadow-md" @saved="onInstSaved" />

    <Sheet v-if="deleting" title="Hapus Akun?" @close="deleting = false">
      <div class="space-y-3">
        <p class="text-sm text-gray-600">Semua data kebun, batch, log, dan panen akan dihapus permanen. Akun default akan dibuat ulang saat server restart. Tindakan ini tidak bisa dibatalkan.</p>
        <input v-model="deletePassword" type="password" class="input" placeholder="Konfirmasi password" />
        <p v-if="deleteError" class="text-sm text-red-600">{{ deleteError }}</p>
        <button class="btn-danger w-full" @click="deleteAccount">Ya, Hapus Semuanya</button>
      </div>
    </Sheet>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import { systemLabel, ensureNotificationPermission } from '../helpers';
import InstallationForm from '../components/InstallationForm.vue';
import Sheet from '../components/Sheet.vue';

const router = useRouter();
const auth = useAuthStore();

const name = ref('');
const pw = reactive({ current: '', next: '' });
const pwMsg = ref('');
const pwOk = ref(false);
const instForm = ref(false);
const editing = ref(null);
const deleting = ref(false);
const deletePassword = ref('');
const deleteError = ref('');
const notifLabel = ref('Aktifkan');

const usedHoles = (i) => i.hole_status.semai + i.hole_status.vegetatif + i.hole_status.panen;
const pct = (n, cap) => `${Math.min(100, (n / cap) * 100)}%`;

async function saveName() {
  const { user } = await api('PUT', '/api/auth/profile', { name: name.value });
  auth.user = user;
}

async function changePassword() {
  pwMsg.value = '';
  try {
    await api('PUT', '/api/auth/password', { current_password: pw.current, new_password: pw.next });
    pwOk.value = true;
    pwMsg.value = 'Password berhasil diubah.';
    pw.current = pw.next = '';
  } catch (err) {
    pwOk.value = false;
    pwMsg.value = err.message;
  }
}

async function removeInst(i) {
  if (!confirm(`Hapus instalasi "${i.name}" beserta seluruh batch & lognya?`)) return;
  await api('DELETE', `/api/installations/${i.id}`);
  await auth.fetchInstallations(true);
}

async function onInstSaved() {
  instForm.value = false;
  editing.value = null;
  await auth.fetchInstallations(true);
}

async function enableNotif() {
  const ok = await ensureNotificationPermission();
  notifLabel.value = ok ? 'Aktif ✓' : 'Ditolak';
}

function logout() {
  auth.logout();
  router.push('/login');
}

async function deleteAccount() {
  deleteError.value = '';
  try {
    await api('DELETE', '/api/auth/account', { password: deletePassword.value });
    auth.logout();
    router.push('/login');
  } catch (err) {
    deleteError.value = err.message;
  }
}

onMounted(async () => {
  await auth.fetchInstallations(true);
  name.value = auth.user?.name || '';
  if ('Notification' in window && Notification.permission === 'granted') notifLabel.value = 'Aktif ✓';
});
</script>
