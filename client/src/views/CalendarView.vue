<template>
  <div>
    <div class="page-head">
      <h1>Kalender</h1>
      <span class="sp"></span>
      <div class="month-nav">
        <button class="mbtn" @click="nav(-1)" aria-label="Sebelumnya"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg></button>
        <b>{{ monthYearLabel }}</b>
        <button class="mbtn" @click="nav(1)" aria-label="Berikutnya"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 6 6 6-6 6"/></svg></button>
      </div>
      <div class="seg">
        <button :class="{ on: mode === 'month' }" @click="mode = 'month'">Bulan</button>
        <button :class="{ on: mode === 'week' }" @click="mode = 'week'">Minggu</button>
      </div>
    </div>

    <div class="chips">
      <button class="chip" :class="{ on: !filterInstallation }" @click="setFilter(null)">Semua instalasi</button>
      <button v-for="i in installations" :key="i.id" class="chip" :class="{ on: filterInstallation === i.id }" @click="setFilter(i.id)">{{ i.name }}</button>
    </div>

    <div class="legend">
      <span><i style="background:var(--ev-semai)"></i>Semai</span>
      <span><i style="background:var(--ev-pindah)"></i>Pindah tanam</span>
      <span><i style="background:var(--ev-cek)"></i>Cek nutrisi</span>
      <span><i style="background:var(--ev-panen)"></i>Panen</span>
    </div>

    <div class="cal-cols">
      <div v-if="mode === 'month'" class="card cal-card">
        <div class="cal">
          <div v-for="w in ['Sen','Sel','Rab','Kam','Jum','Sab','Min']" :key="w" class="wd">{{ w }}</div>
          <button v-for="day in visibleDays" :key="day.date" class="cell" :class="{ dim: !day.inPeriod, today: day.date === today, sel: day.date === selected }" @click="select(day.date)">
            <span v-if="day.pending" class="cnt">{{ day.pending }}</span>
            <span class="num">{{ day.dayOfMonth }}</span>
            <span class="dots">
              <i v-for="(c, i) in day.dots.slice(0, 4)" :key="i" :style="{ background: c }"></i>
              <span v-if="day.dots.length > 4" class="more-dots">+{{ day.dots.length - 4 }}</span>
            </span>
          </button>
        </div>
      </div>
      <div v-else class="week-list card" style="padding:0 16px">
        <div v-for="day in weekDays" :key="day.date" class="week-day">
          <h4>{{ formatLong(day.date) }}{{ day.date === today ? ' · Hari ini' : '' }}</h4>
          <div v-if="day.events.length" class="task-list">
            <div v-for="(e, i) in day.events" :key="i" class="ev-row" @click="eventSheet = e">
              <span class="bar" :style="{ background: (EVENT_META[e.type] || EVENT_META.lainnya).col }"></span>
              <div class="b"><div class="t">{{ e.title }}</div><div class="m">{{ e.batch_name || instName(e) }} · {{ (EVENT_META[e.type] || EVENT_META.lainnya).label }}</div></div>
            </div>
          </div>
          <div v-else class="empty-note">Tidak ada jadwal.</div>
        </div>
      </div>

      <div v-if="mode === 'month'">
        <div class="card" style="padding:16px">
          <h3 style="font-size:17px">{{ formatLong(selected) }}</h3>
          <div style="margin-top:6px">
            <div v-if="selectedEvents.length" class="task-list" style="margin-top:0">
              <div v-for="(e, i) in selectedEvents" :key="i" class="ev-row" @click="eventSheet = e">
                <span class="bar" :style="{ background: (EVENT_META[e.type] || EVENT_META.lainnya).col }"></span>
                <div class="b"><div class="t">{{ e.title }}</div><div class="m">{{ e.batch_name || instName(e) }} · {{ (EVENT_META[e.type] || EVENT_META.lainnya).label }}<template v-if="e.recurring"> · berulang</template><template v-if="e.overdue"> · terlewat</template></div></div>
              </div>
            </div>
            <div v-else class="empty-note">Belum ada jadwal di tanggal ini.</div>
          </div>
          <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:12px" @click="addSheet = true">+ Tambah jadwal di tanggal ini</button>
        </div>
      </div>
    </div>
    <p class="hint">Tap tanggal untuk melihat detail atau menambah jadwal baru.</p>

    <AddEventSheet v-if="addSheet" :date="selected" :installations="installations" @close="addSheet = false" @saved="onSaved" @new-batch="onNewBatch" @toast="onToast" />
    <BatchFormSheet v-if="batchSheet" :preset-date="selected" @close="batchSheet = false" @saved="onSaved" @toast="onToast" />
    <EventSheet v-if="eventSheet" :event="eventSheet" @close="eventSheet = null" @changed="onSaved" @log="onEventLog" @toast="onToast" />
    <QuickLogSheet v-if="logEvent" :preset-batch-id="logEvent.batch_id" :preset-installation-id="logEvent.installation_id" :preset-type="logEvent.type === 'ganti_larutan' ? 'kuras' : 'cek'" @close="logEvent = null" @saved="onEventLogSaved" @toast="onToast" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import { EVENT_META, todayStr, toStr, parseDate, formatLong, monthYear } from '../helpers';
import AddEventSheet from '../components/AddEventSheet.vue';
import BatchFormSheet from '../components/BatchFormSheet.vue';
import EventSheet from '../components/EventSheet.vue';
import QuickLogSheet from '../components/QuickLogSheet.vue';

const auth = useAuthStore();
const mode = ref('month');
const cursor = ref(todayStr());
const selected = ref(todayStr());
const events = ref([]);
const installations = ref([]);
const filterInstallation = ref(null);
const addSheet = ref(false);
const batchSheet = ref(false);
const eventSheet = ref(null);
const logEvent = ref(null);
const today = todayStr();

const period = computed(() => {
  const d = parseDate(cursor.value);
  if (mode.value === 'month') {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 41);
    return { start: toStr(start), end: toStr(end), gridStart: toStr(start), days: 42 };
  }
  const start = new Date(d); start.setDate(d.getDate() - d.getDay());
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return { start: toStr(start), end: toStr(end), gridStart: toStr(start), days: 7 };
});

const monthYearLabel = computed(() => monthYear(cursor.value));

const visibleDays = computed(() => {
  const out = [];
  const start = parseDate(period.value.gridStart);
  const inMonth = parseDate(cursor.value).getMonth();
  for (let i = 0; i < period.value.days; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const date = toStr(d);
    const dayEvents = events.value.filter((e) => e.date === date);
    out.push({
      date, dayOfMonth: d.getDate(),
      inPeriod: d.getMonth() === inMonth,
      dots: [...new Set(dayEvents.map((e) => (EVENT_META[e.type] || EVENT_META.lainnya).col))],
      pending: dayEvents.filter((e) => e.task_id && !e.snoozed && date <= today).length,
    });
  }
  return out;
});

const weekDays = computed(() => {
  const start = parseDate(period.value.gridStart);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const date = toStr(d);
    out.push({ date, events: events.value.filter((e) => e.date === date) });
  }
  return out;
});

const selectedEvents = computed(() => events.value.filter((e) => e.date === selected.value));
const instName = (e) => installations.value.find((i) => i.id === e.installation_id)?.name || '—';

function select(date) {
  selected.value = date;
  if (mode.value === 'month' && date.slice(0, 7) !== cursor.value.slice(0, 7)) { cursor.value = date; load(); }
}
function nav(dir) {
  const d = parseDate(cursor.value);
  if (mode.value === 'month') d.setMonth(d.getMonth() + dir, 1);
  else d.setDate(d.getDate() + dir * 7);
  cursor.value = toStr(d);
  load();
}
function setFilter(id) { filterInstallation.value = id; load(); }

async function load() {
  const params = new URLSearchParams({ start: period.value.start, end: period.value.end });
  if (filterInstallation.value) params.set('installation_id', filterInstallation.value);
  try { events.value = (await api('GET', `/api/calendar?${params}`)).events || []; } catch { /* offline */ }
}
function onNewBatch() { addSheet.value = false; batchSheet.value = true; }
function onSaved() { addSheet.value = false; batchSheet.value = false; eventSheet.value = null; load(); window.dispatchEvent(new CustomEvent('hg:refresh')); }
function onEventLog() { logEvent.value = eventSheet.value; eventSheet.value = null; }
async function onEventLogSaved() {
  const ev = logEvent.value; logEvent.value = null;
  if (ev?.task_id) await api('POST', `/api/tasks/${ev.task_id}/complete`).catch(() => {});
  load(); window.dispatchEvent(new CustomEvent('hg:refresh'));
}
function onToast(m) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: m })); }

onMounted(async () => {
  load();
  installations.value = auth.installations.length ? auth.installations : await api('GET', '/api/installations').catch(() => []);
  window.addEventListener('hg:refresh', load);
});
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
