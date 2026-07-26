<template>
  <div class="space-y-3">
    <!-- Kontrol: mode, navigasi, filter -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex rounded-xl bg-gray-100 p-1">
        <button class="rounded-lg px-3 py-1.5 text-sm font-medium" :class="mode === 'month' ? 'bg-white shadow text-leaf-700' : 'text-gray-500'" @click="mode = 'month'">Bulan</button>
        <button class="rounded-lg px-3 py-1.5 text-sm font-medium" :class="mode === 'week' ? 'bg-white shadow text-leaf-700' : 'text-gray-500'" @click="mode = 'week'">Minggu</button>
      </div>
      <select v-model="filterInstallation" class="input !w-auto !py-1.5 text-sm" @change="load">
        <option :value="null">Semua instalasi</option>
        <option v-for="i in installations" :key="i.id" :value="i.id">{{ i.name }}</option>
      </select>
    </div>

    <div class="flex items-center justify-between">
      <button class="btn-ghost !min-h-0 p-2 text-xl" @click="nav(-1)" aria-label="Sebelumnya">‹</button>
      <h2 class="font-bold">{{ periodLabel }}</h2>
      <button class="btn-ghost !min-h-0 p-2 text-xl" @click="nav(1)" aria-label="Berikutnya">›</button>
    </div>

    <!-- Grid kalender -->
    <div class="card !p-2">
      <div class="grid grid-cols-7 text-center text-xs font-medium text-gray-400">
        <span v-for="d in HARI" :key="d" class="py-1">{{ d }}</span>
      </div>
      <div class="grid grid-cols-7 gap-0.5">
        <button
          v-for="day in visibleDays" :key="day.date"
          class="relative flex min-h-[52px] flex-col items-center rounded-xl py-1 transition"
          :class="[
            day.inPeriod ? 'text-gray-900' : 'text-gray-300',
            day.date === selected ? 'bg-leaf-600 text-white' : day.date === today ? 'bg-leaf-100 font-bold text-leaf-800' : 'hover:bg-gray-50',
          ]"
          @click="select(day.date)"
        >
          <span class="text-sm">{{ day.dayOfMonth }}</span>
          <span class="mt-0.5 flex gap-0.5">
            <span v-for="(c, i) in day.dots.slice(0, 4)" :key="i" class="h-1.5 w-1.5 rounded-full"
              :class="[c, day.date === selected ? '!bg-white' : '']" />
          </span>
          <span v-if="day.pending > 0 && day.date !== selected"
            class="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
            {{ day.pending }}
          </span>
        </button>
      </div>
    </div>

    <!-- Legenda -->
    <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
      <span v-for="(m, k) in legend" :key="k" class="flex items-center gap-1">
        <span class="h-2 w-2 rounded-full" :class="m.dot" />{{ m.label }}
      </span>
    </div>

    <!-- Event tanggal terpilih -->
    <div>
      <div class="mb-2 flex items-center justify-between">
        <h3 class="font-bold">{{ formatId(selected) }}</h3>
        <button class="btn-secondary !min-h-0 !py-1.5 text-sm" @click="addSheet = true">+ Tambah Jadwal</button>
      </div>
      <div v-if="selectedEvents.length === 0" class="card py-6 text-center text-sm text-gray-400">
        Belum ada kegiatan. Tap "+ Tambah Jadwal" untuk merencanakan.
      </div>
      <div v-else class="space-y-2">
        <button v-for="(e, i) in selectedEvents" :key="i" class="card flex w-full items-center gap-3 !p-3 text-left" @click="eventSheet = e">
          <span class="h-3 w-3 shrink-0 rounded-full" :class="(EVENT_META[e.type] || EVENT_META.lainnya).dot" />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">{{ e.title }}</p>
            <p class="text-xs text-gray-500">
              {{ (EVENT_META[e.type] || EVENT_META.lainnya).label }}
              <span v-if="e.recurring"> · berulang</span>
              <span v-if="e.overdue" class="text-red-500"> · terlewat</span>
            </p>
          </div>
          <span class="text-gray-300">›</span>
        </button>
      </div>
    </div>

    <AddEventSheet
      v-if="addSheet" :date="selected" :installations="installations"
      @close="addSheet = false" @saved="onSaved" @new-batch="onNewBatch"
    />
    <BatchFormSheet v-if="batchSheet" :preset-date="selected" @close="batchSheet = false" @saved="onSaved" />
    <EventSheet
      v-if="eventSheet" :event="eventSheet"
      @close="eventSheet = null" @changed="onSaved" @log="onEventLog"
    />
    <QuickLogSheet
      v-if="logEvent" :preset-batch-id="logEvent.batch_id" :preset-installation-id="logEvent.installation_id"
      :preset-type="logEvent.type === 'ganti_larutan' ? 'kuras' : 'cek'"
      @close="logEvent = null" @saved="onEventLogSaved"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { HARI, BULAN_PANJANG, EVENT_META, todayStr, toStr, parseDate, formatId } from '../helpers';
import AddEventSheet from '../components/AddEventSheet.vue';
import EventSheet from '../components/EventSheet.vue';
import BatchFormSheet from '../components/BatchFormSheet.vue';
import QuickLogSheet from '../components/QuickLogSheet.vue';

const mode = ref('month');
const cursor = ref(todayStr()); // tanggal acuan periode
const selected = ref(todayStr());
const events = ref([]);
const installations = ref([]);
const filterInstallation = ref(null);
const addSheet = ref(false);
const batchSheet = ref(false);
const eventSheet = ref(null);
const logEvent = ref(null);
const today = todayStr();

const legend = {
  semai: EVENT_META.semai, pindah: EVENT_META.pindah,
  cek_nutrisi: EVENT_META.cek_nutrisi, ganti_larutan: EVENT_META.ganti_larutan, panen: EVENT_META.panen,
};

const period = computed(() => {
  const d = parseDate(cursor.value);
  if (mode.value === 'month') {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay()); // mundur ke Minggu
    const end = new Date(start);
    end.setDate(start.getDate() + 41); // 6 minggu grid
    return { start: toStr(start), end: toStr(end), gridStart: toStr(start), days: 42 };
  }
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toStr(start), end: toStr(end), gridStart: toStr(start), days: 7 };
});

const periodLabel = computed(() => {
  const d = parseDate(cursor.value);
  if (mode.value === 'month') return `${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`;
  const s = parseDate(period.value.start);
  const e = parseDate(period.value.end);
  return `${s.getDate()} ${BULAN_PANJANG[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${BULAN_PANJANG[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
});

const visibleDays = computed(() => {
  const out = [];
  const start = parseDate(period.value.gridStart);
  const inMonth = parseDate(cursor.value).getMonth();
  for (let i = 0; i < period.value.days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = toStr(d);
    const dayEvents = events.value.filter((e) => e.date === date);
    out.push({
      date,
      dayOfMonth: d.getDate(),
      inPeriod: mode.value === 'week' || d.getMonth() === inMonth,
      dots: [...new Set(dayEvents.map((e) => (EVENT_META[e.type] || EVENT_META.lainnya).dot))],
      pending: dayEvents.filter((e) => e.task_id && !e.snoozed).length,
    });
  }
  return out;
});

const selectedEvents = computed(() => events.value.filter((e) => e.date === selected.value));

function select(date) {
  selected.value = date;
  if (mode.value === 'month' && date.slice(0, 7) !== cursor.value.slice(0, 7)) {
    cursor.value = date; // ikut pindah bulan
    load();
  }
}

function nav(dir) {
  const d = parseDate(cursor.value);
  if (mode.value === 'month') d.setMonth(d.getMonth() + dir, 1);
  else d.setDate(d.getDate() + dir * 7);
  cursor.value = toStr(d);
  load();
}

async function load() {
  const params = new URLSearchParams({ start: period.value.start, end: period.value.end });
  if (filterInstallation.value) params.set('installation_id', filterInstallation.value);
  try {
    const data = await api('GET', `/api/calendar?${params}`);
    events.value = data.events;
  } catch { /* offline */ }
}

function onNewBatch() {
  addSheet.value = false;
  batchSheet.value = true;
}

function onSaved() {
  addSheet.value = false;
  batchSheet.value = false;
  eventSheet.value = null;
  load();
  window.dispatchEvent(new CustomEvent('hg:refresh'));
}

function onEventLog() {
  logEvent.value = eventSheet.value;
  eventSheet.value = null;
}

async function onEventLogSaved() {
  const ev = logEvent.value;
  logEvent.value = null;
  if (ev?.task_id) await api('POST', `/api/tasks/${ev.task_id}/complete`).catch(() => {});
  load();
  window.dispatchEvent(new CustomEvent('hg:refresh'));
}

onMounted(async () => {
  load();
  installations.value = await api('GET', '/api/installations').catch(() => []);
  window.addEventListener('hg:refresh', load);
});
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
