<template>
  <router-view v-if="isBareRoute" />
  <div v-else class="shell">
    <aside class="sidebar">
      <router-link to="/" class="brand"><span v-html="ICON.leaf"></span><b>HidroGrow</b></router-link>
      <nav class="snav">
        <router-link to="/" class="on" exact-active-class="on"><span v-html="ICON.navToday"></span>Hari Ini</router-link>
        <router-link to="/kalender" active-class="on"><span v-html="ICON.navCal"></span>Kalender</router-link>
        <router-link to="/tanam" active-class="on"><span v-html="ICON.navGrow"></span>Tanam</router-link>
        <router-link to="/log" active-class="on"><span v-html="ICON.navLog"></span>Log</router-link>
        <router-link to="/laporan" active-class="on"><span v-html="ICON.navReport"></span>Laporan</router-link>
      </nav>
      <div class="side-sec">
        <span class="eyebrow">Instalasi</span>
        <div class="side-inst">
          <span v-for="i in auth.installations" :key="i.id">{{ i.name }} <b>{{ usedHoles(i) }}/{{ i.capacity || 0 }}</b></span>
          <span v-if="!auth.installations.length" style="opacity:.6">Belum ada</span>
        </div>
      </div>
      <router-link to="/pengaturan" class="side-user" style="text-decoration:none">
        <span class="avatar">{{ initial }}</span>
        <span><span class="nm">{{ auth.user?.name || 'Pengguna' }}</span><br><span class="em">@{{ auth.user?.username || '—' }}</span></span>
      </router-link>
    </aside>

    <div class="content">
      <header class="appbar">
        <router-link to="/" class="brand"><span v-html="ICON.leaf"></span><b>HidroGrow</b></router-link>
        <span class="sp"></span>
        <span v-if="offlineQueue > 0" class="badge b-warn" title="Data menunggu sinkronisasi">⏳ {{ offlineQueue }}</span>
        <router-link to="/" class="bell" aria-label="Tugas hari ini">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.5 20a1.8 1.8 0 0 0 3 0"/></svg>
          <span v-if="pending > 0" class="n">{{ pending > 99 ? '99+' : pending }}</span>
        </router-link>
        <router-link to="/pengaturan"><span class="avatar">{{ initial }}</span></router-link>
      </header>

      <main class="main">
        <router-view @open-quick-log="sheet='log'" @open-batch-form="sheet='batch'" @open-harvest="sheet='harvest'" @toast="onToast" />
      </main>
    </div>

    <nav class="bnav">
      <router-link to="/" exact-active-class="on"><span class="ic" v-html="ICON.navToday"></span>Hari Ini</router-link>
      <router-link to="/kalender" active-class="on"><span class="ic" v-html="ICON.navCal"></span>Kalender</router-link>
      <router-link to="/tanam" active-class="on"><span class="ic" v-html="ICON.navGrow"></span>Tanam</router-link>
      <router-link to="/log" active-class="on"><span class="ic" v-html="ICON.navLog"></span>Log</router-link>
      <router-link to="/laporan" active-class="on"><span class="ic" v-html="ICON.navReport"></span>Laporan</router-link>
    </nav>

    <button class="fab" :class="{ open: fabOpen }" aria-label="Aksi cepat" @click="fabOpen = !fabOpen"><span v-html="ICON.plus"></span></button>
    <div class="fabmenu" :class="{ show: fabOpen }">
      <button @click="open('log')"><span class="lbl">Catat pH / PPM</span><span class="cir"><span v-html="ICON.drop"></span></span></button>
      <button @click="open('panen')"><span class="lbl">Catat panen</span><span class="cir"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="M6 20c0-5 2.7-8 6-8s6 3 6 8"/><path d="M12 12V6"/><path d="M12 8c0-2 1.6-3.5 4-3.5 0 2-1.6 3.5-4 3.5Z"/></svg></span></button>
      <button @click="open('batch')"><span class="lbl">Batch baru</span><span class="cir"><span v-html="ICON.navGrow"></span></span></button>
    </div>

    <div class="toast-root">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="{ show: t.show }">{{ t.msg }}</div>
    </div>

    <QuickLogSheet v-if="sheet === 'log'" @close="sheet = null" @saved="onSaved" @toast="onToast" />
    <BatchFormSheet v-if="sheet === 'batch'" :preset-date="presetDate" @close="sheet = null" @saved="onSaved" @toast="onToast" />
    <HarvestSheet v-if="sheet === 'harvest'" @close="sheet = null" @saved="onSaved" @toast="onToast" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { queueCount, flushQueue, api } from './api';
import { ICON } from './helpers';
import QuickLogSheet from './components/QuickLogSheet.vue';
import BatchFormSheet from './components/BatchFormSheet.vue';
import HarvestSheet from './components/HarvestSheet.vue';

const route = useRoute();
const auth = useAuthStore();
const isBareRoute = computed(() => ['login', 'onboarding'].includes(route.name));

const initial = computed(() => (auth.user?.name || 'A').charAt(0).toUpperCase());
const usedHoles = (i) => i.hole_status ? (i.hole_status.semai + i.hole_status.vegetatif + i.hole_status.panen) : 0;

const fabOpen = ref(false);
const sheet = ref(null);
const presetDate = ref(null);
const pending = ref(0);
const offlineQueue = ref(0);
const toasts = ref([]);
let toastSeq = 0;

function open(name) { fabOpen.value = false; sheet.value = name; }
function onSaved() { sheet.value = null; presetDate.value = null; window.dispatchEvent(new CustomEvent('hg:refresh')); }
function onToast(msg) { pushToast(msg); }

function pushToast(msg) {
  const id = ++toastSeq;
  const t = { id, msg, show: false };
  toasts.value.push(t);
  requestAnimationFrame(() => requestAnimationFrame(() => { const x = toasts.value.find((y) => y.id === id); if (x) x.show = true; }));
  setTimeout(() => {
    const x = toasts.value.find((y) => y.id === id); if (x) x.show = false;
    setTimeout(() => { toasts.value = toasts.value.filter((y) => y.id !== id); }, 300);
  }, 2600);
}

function updateQueue() { offlineQueue.value = queueCount(); }
async function loadPending() {
  try {
    const tasks = await api('GET', '/api/tasks/today');
    pending.value = tasks.length;
  } catch { /* offline */ }
}

// Expose toast & openSheet globally supaya komponen bisa memanggil via emit
defineExpose({ openSheet: (name, date) => { presetDate.value = date; sheet.value = name; }, toast: pushToast });

onMounted(async () => {
  updateQueue();
  window.addEventListener('online', updateQueue);
  window.addEventListener('hg:refresh', loadPending);
  window.addEventListener('hg:open-sheet', (e) => { if (e.detail?.date) presetDate.value = e.detail.date; sheet.value = e.detail?.type || 'batch'; });
  window.addEventListener('hg:toast', (e) => pushToast(e.detail));
  loadPending();
  const flushed = await flushQueue();
  if (flushed > 0) window.dispatchEvent(new CustomEvent('hg:refresh'));
});
onUnmounted(() => {
  window.removeEventListener('online', updateQueue);
  window.removeEventListener('hg:refresh', loadPending);
});
</script>
