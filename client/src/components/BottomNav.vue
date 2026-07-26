<template>
  <nav class="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">
    <div class="mx-auto flex max-w-lg">
      <router-link
        v-for="item in items" :key="item.to" :to="item.to"
        class="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-xs transition"
        :class="isActive(item) ? 'font-semibold text-leaf-600' : 'text-gray-500 hover:text-gray-700'"
      >
        <span class="text-xl leading-none">{{ item.icon }}</span>
        {{ item.label }}
        <span v-if="item.to === '/' && pending > 0" class="absolute -mt-9 ml-8 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {{ pending > 99 ? '99+' : pending }}
        </span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';

const route = useRoute();
const items = [
  { to: '/', label: 'Hari Ini', icon: '✅', match: ['today'] },
  { to: '/kalender', label: 'Kalender', icon: '📅', match: ['calendar'] },
  { to: '/tanam', label: 'Tanam', icon: '🌱', match: ['grow', 'batch-detail'] },
  { to: '/log', label: 'Log', icon: '💧', match: ['logs'] },
  { to: '/laporan', label: 'Laporan', icon: '📊', match: ['reports'] },
];

const pending = ref(0);

function isActive(item) { return item.match.includes(route.name); }

async function loadPending() {
  try {
    const tasks = await api('GET', '/api/tasks/today');
    pending.value = tasks.length;
  } catch { /* offline: biarkan badge terakhir */ }
}

onMounted(() => {
  loadPending();
  window.addEventListener('hg:refresh', loadPending);
});
onUnmounted(() => window.removeEventListener('hg:refresh', loadPending));
</script>
