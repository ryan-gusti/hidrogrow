<template>
  <div class="space-y-4">
    <div>
      <p class="text-sm text-gray-500">{{ formatId(todayStr()) }}</p>
      <h2 class="text-xl font-bold">Halo, {{ auth.user?.name }} 👋</h2>
    </div>

    <div v-if="notifBanner" class="card flex items-center justify-between gap-2 !border-amber-200 !bg-amber-50">
      <p class="text-sm text-amber-800">Aktifkan notifikasi agar tidak lupa tugas kebun.</p>
      <button class="btn-secondary !min-h-0 !py-1.5 text-sm" @click="enableNotif">Aktifkan</button>
    </div>

    <div v-if="loading" class="py-10 text-center text-gray-400">Memuat tugas…</div>

    <template v-else>
      <div v-if="tasks.length === 0" class="card py-10 text-center">
        <span class="text-4xl">🎉</span>
        <p class="mt-2 font-medium">Tidak ada tugas hari ini</p>
        <p class="text-sm text-gray-500">Kebunmu aman terkendali.</p>
      </div>

      <div v-else class="space-y-2">
        <p class="text-sm font-medium text-gray-600">{{ tasks.length }} tugas menunggumu:</p>
        <TaskCard
          v-for="t in tasks" :key="t.id" :task="t"
          @complete="complete(t)" @log="logTask = t" @snooze="snoozeTask = t"
        />
      </div>

      <!-- Ringkasan batch aktif -->
      <div v-if="batches.length" class="pt-2">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="font-bold">Batch Aktif</h3>
          <router-link to="/tanam" class="text-sm font-medium text-leaf-600">Lihat semua →</router-link>
        </div>
        <div class="space-y-2">
          <router-link v-for="b in batches.slice(0, 3)" :key="b.id" :to="`/tanam/${b.id}`" class="card flex items-center justify-between !p-3">
            <div>
              <p class="font-medium">{{ b.name }}</p>
              <p class="text-xs text-gray-500">Hari ke-{{ b.day_number }} · Fase {{ b.current_phase }}</p>
            </div>
            <span class="chip bg-leaf-100 text-leaf-700">{{ b.current_phase }}</span>
          </router-link>
        </div>
      </div>
    </template>

    <QuickLogSheet
      v-if="logTask"
      :preset-batch-id="logTask.batch_id"
      :preset-installation-id="logTask.installation_id"
      :preset-type="logTask.type === 'ganti_larutan' ? 'kuras' : 'cek'"
      @close="onLogClose" @saved="onLogSaved"
    />
    <SnoozeSheet v-if="snoozeTask" :task="snoozeTask" @close="snoozeTask = null" @snoozed="onSnoozed" />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import { formatId, todayStr, ensureNotificationPermission, notifyDailyTasks } from '../helpers';
import TaskCard from '../components/TaskCard.vue';
import QuickLogSheet from '../components/QuickLogSheet.vue';
import SnoozeSheet from '../components/SnoozeSheet.vue';

const auth = useAuthStore();
const tasks = ref([]);
const batches = ref([]);
const loading = ref(true);
const logTask = ref(null);
const snoozeTask = ref(null);
const notifBanner = ref(false);

async function load() {
  loading.value = true;
  try {
    [tasks.value, batches.value] = await Promise.all([
      api('GET', '/api/tasks/today'),
      api('GET', '/api/batches?status=active'),
    ]);
    notifyDailyTasks(tasks.value.length);
  } catch { /* offline */ } finally {
    loading.value = false;
  }
}

async function complete(task) {
  await api('POST', `/api/tasks/${task.id}/complete`);
  tasks.value = tasks.value.filter((t) => t.id !== task.id);
  window.dispatchEvent(new CustomEvent('hg:refresh'));
}

function onLogClose() { logTask.value = null; }

async function onLogSaved() {
  const task = logTask.value;
  logTask.value = null;
  if (task) await complete(task); // selesai "cek pH" otomatis setelah log tersimpan (F-5.6)
}

async function onSnoozed() {
  snoozeTask.value = null;
  await load();
  window.dispatchEvent(new CustomEvent('hg:refresh'));
}

async function enableNotif() {
  await ensureNotificationPermission();
  notifBanner.value = false;
}

onMounted(() => {
  notifBanner.value = 'Notification' in window && Notification.permission === 'default';
  load();
  window.addEventListener('hg:refresh', load);
});
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
