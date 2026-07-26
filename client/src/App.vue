<template>
  <router-view v-if="isBareRoute" />
  <div v-else class="mx-auto flex min-h-dvh max-w-lg flex-col">
    <header class="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur">
      <div class="flex items-center gap-2">
        <img src="/icon.svg" alt="HidroGrow" class="h-8 w-8" />
        <h1 class="text-lg font-bold text-leaf-700">{{ title }}</h1>
      </div>
      <div class="flex items-center gap-1">
        <span v-if="offlineQueue > 0" class="chip bg-amber-100 text-amber-700" title="Data menunggu sinkronisasi">
          ⏳ {{ offlineQueue }}
        </span>
        <router-link to="/pengaturan" class="btn-ghost !min-h-0 p-2" aria-label="Pengaturan">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </router-link>
      </div>
    </header>

    <main class="flex-1 px-4 pb-28 pt-4">
      <router-view @open-quick-log="sheet = 'log'" @open-batch-form="sheet = 'batch'" @open-harvest="sheet = 'harvest'" />
    </main>

    <!-- FAB aksi cepat -->
    <div class="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 sm:right-[calc(50%-16rem)]">
      <template v-if="fabOpen">
        <button class="btn-secondary shadow-lg !py-2 text-sm" @click="open('batch')">🌱 Batch Baru</button>
        <button class="btn-secondary shadow-lg !py-2 text-sm" @click="open('harvest')">🧺 Catat Panen</button>
        <button class="btn-secondary shadow-lg !py-2 text-sm" @click="open('log')">💧 Catat pH/PPM</button>
      </template>
      <button
        class="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-600 text-3xl text-white shadow-lg transition hover:bg-leaf-700 active:scale-95"
        :class="{ 'rotate-45': fabOpen }"
        @click="fabOpen = !fabOpen"
        aria-label="Aksi cepat"
      >+</button>
    </div>

    <BottomNav />

    <!-- Sheet aksi cepat -->
    <QuickLogSheet v-if="sheet === 'log'" @close="sheet = null" @saved="onSaved" />
    <BatchFormSheet v-if="sheet === 'batch'" @close="sheet = null" @saved="onSaved" />
    <HarvestSheet v-if="sheet === 'harvest'" @close="sheet = null" @saved="onSaved" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import BottomNav from './components/BottomNav.vue';
import QuickLogSheet from './components/QuickLogSheet.vue';
import BatchFormSheet from './components/BatchFormSheet.vue';
import HarvestSheet from './components/HarvestSheet.vue';
import { queueCount, flushQueue } from './api';

const route = useRoute();
const isBareRoute = computed(() => ['login', 'onboarding'].includes(route.name));
const titles = {
  today: 'Hari Ini', calendar: 'Kalender', grow: 'Tanam', 'batch-detail': 'Detail Batch',
  logs: 'Log Nutrisi', reports: 'Laporan', settings: 'Pengaturan',
};
const title = computed(() => titles[route.name] || 'HidroGrow');

const fabOpen = ref(false);
const sheet = ref(null);
const offlineQueue = ref(0);

function open(name) {
  fabOpen.value = false;
  sheet.value = name;
}

function onSaved() {
  sheet.value = null;
  // Beri tahu view aktif untuk refresh
  window.dispatchEvent(new CustomEvent('hg:refresh'));
}

function updateQueue() { offlineQueue.value = queueCount(); }

onMounted(async () => {
  updateQueue();
  window.addEventListener('online', updateQueue);
  window.addEventListener('hg:refresh', updateQueue);
  const flushed = await flushQueue();
  if (flushed > 0) window.dispatchEvent(new CustomEvent('hg:refresh'));
});

onUnmounted(() => {
  window.removeEventListener('online', updateQueue);
  window.removeEventListener('hg:refresh', updateQueue);
});
</script>
