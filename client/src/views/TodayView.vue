<template>
  <div>
    <div class="greet">
      <span class="eyebrow">{{ formatLong(todayStr()) }}</span>
      <h1>{{ sapa }}, {{ auth.user?.name || 'Teman' }}.</h1>
      <p v-if="tasks.length === 0">Semua tugas hari ini beres. Kebunmu aman — nikmati harimu.</p>
      <p v-else><b>{{ openCount }} tugas</b> menunggu di kebunmu<template v-if="lateCount"> — <b>{{ lateCount }} di antaranya sudah lewat jadwal</b>.</template><template v-else>.</template></p>
    </div>

    <div class="stat-grid">
      <div class="stat"><div class="v">{{ batchCount }}</div><div class="k">Batch aktif</div></div>
      <div class="stat"><div class="v">{{ siapPanen }}</div><div class="k">Siap panen</div></div>
      <div class="stat"><div class="v">{{ lastPh ? comma(lastPh) : '—' }}</div><div class="k">pH terakhir · {{ lastName || '—' }}</div></div>
      <div class="stat"><div class="v">{{ kg(monthGrams) }} <small>kg</small></div><div class="k">Panen bulan ini</div></div>
    </div>

    <section v-if="heroInst" class="hero">
      <img :src="heroImg" alt="Instalasi hidroponik" loading="eager" />
      <div class="panel">
        <div class="t">
          <h3>{{ heroInst.name }}</h3>
          <span class="badge b-ok"><span class="dot"></span>Aktif</span>
          <span class="meta">{{ systemLabel(heroInst.system_type) }} · Tandon {{ comma(heroInst.reservoir_volume) }} L</span>
        </div>
        <div class="hole-grid" :aria-label="`Status ${heroInst.capacity} lubang tanam`">
          <span v-for="(h, i) in heroHoles" :key="i" class="hole" :class="h" :title="h"></span>
        </div>
        <div class="hole-legend">
          <span v-if="heroCounts.vegetatif"><i style="background:var(--leaf)"></i>Vegetatif {{ heroCounts.vegetatif }}</span>
          <span v-if="heroCounts.semai"><i style="background:var(--ev-semai)"></i>Semai {{ heroCounts.semai }}</span>
          <span v-if="heroCounts.siap"><i style="background:var(--ev-panen)"></i>Siap panen {{ heroCounts.siap }}</span>
          <span v-if="heroCounts.kosong"><i style="border:1.5px dashed var(--meta)"></i>Kosong {{ heroCounts.kosong }}</span>
        </div>
      </div>
    </section>

    <div class="cols">
      <div>
        <section class="sec" style="margin-top:18px">
          <div class="sec-head"><h2>Tugas Hari Ini</h2><span class="badge b-muted">{{ openCount }} terbuka</span><span class="sp"></span></div>
          <div v-if="loading" class="empty-note">Memuat tugas…</div>
          <div v-else-if="tasks.length === 0" class="card" style="padding:20px;text-align:center;color:var(--muted)">Semua tugas beres. Saatnya menikmati kebun.</div>
          <div v-else class="task-list">
            <TaskCard v-for="t in tasks" :key="t.id" :task="t" @complete="complete(t)" @log="logTask = t" @snooze="snoozeTask = t" />
          </div>
        </section>
      </div>
      <div>
        <section class="sec" style="margin-top:18px">
          <div class="sec-head"><h2>Instalasi</h2><span class="sp"></span></div>
          <div class="inst-grid">
            <router-link v-for="i in auth.installations" :key="i.id" to="/pengaturan" class="card inst-card" style="text-decoration:none">
              <div class="top"><h3>{{ i.name }}</h3><span class="nums">{{ usedHoles(i) }}/{{ i.capacity || 0 }} lubang</span></div>
              <div class="sys">{{ systemLabel(i.system_type) }} · {{ comma(i.reservoir_volume) }} L</div>
              <div class="hole-grid" style="margin-top:8px">
                <span v-for="(h, idx) in holesOf(i)" :key="idx" class="hole" :class="h"></span>
              </div>
            </router-link>
          </div>
        </section>
        <section class="sec">
          <div class="sec-head"><h2>Segera Datang</h2><span class="sp"></span><router-link to="/kalender" class="more">Lihat kalender</router-link></div>
          <div class="up-scroll">
            <div v-for="(e, i) in upcoming" :key="i" class="up-card">
              <div class="d">{{ formatShort(e.date) }}</div>
              <div class="t">{{ e.title }}</div>
              <span class="badge" :class="(EVENT_META[e.type] || EVENT_META.lainnya).cls"><span class="dot"></span>{{ (EVENT_META[e.type] || EVENT_META.lainnya).label }}</span>
            </div>
            <div v-if="!upcoming.length" class="empty-note" style="padding:0">Belum ada jadwal mendatang.</div>
          </div>
        </section>
      </div>
    </div>

    <QuickLogSheet v-if="logTask" :task="logTask" :preset-batch-id="logTask.batch_id" :preset-installation-id="logTask.installation_id" :preset-type="logTask.type === 'ganti_larutan' ? 'kuras' : 'cek'" @close="logTask = null" @saved="onLogSaved" @toast="onToast" />
    <SnoozeSheet v-if="snoozeTask" :task="snoozeTask" @close="snoozeTask = null" @snoozed="onSnoozed" @toast="onToast" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { useAuthStore } from '../stores/auth';
import { formatLong, formatShort, todayStr, addDays, EVENT_META, systemLabel, comma, kg, notifyDailyTasks, ensureNotificationPermission, ICON } from '../helpers';
import TaskCard from '../components/TaskCard.vue';
import QuickLogSheet from '../components/QuickLogSheet.vue';
import SnoozeSheet from '../components/SnoozeSheet.vue';

const auth = useAuthStore();
const tasks = ref([]);
const batches = ref([]);
const upcoming = ref([]);
const lastPh = ref(null);
const lastName = ref('');
const monthGrams = ref(0);
const loading = ref(true);
const logTask = ref(null);
const snoozeTask = ref(null);

const sapa = computed(() => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam'; });
const openCount = computed(() => tasks.value.length);
const lateCount = computed(() => tasks.value.filter((t) => t.due_date < todayStr()).length);
const batchCount = computed(() => batches.value.length);
const siapPanen = computed(() => batches.value.filter((b) => b.current_phase === 'Panen').length);

const heroInst = computed(() => auth.installations[0] || null);
const heroImg = '/assets/hero-nft.jpg';
const heroCounts = computed(() => {
  const c = { kosong: 0, semai: 0, vegetatif: 0, siap: 0 };
  const inst = heroInst.value;
  if (!inst || !inst.hole_status) return c;
  c.semai = inst.hole_status.semai; c.vegetatif = inst.hole_status.vegetatif; c.siap = inst.hole_status.panen;
  c.kosong = Math.max(0, (inst.capacity || 0) - c.semai - c.vegetatif - c.siap);
  return c;
});
const heroHoles = computed(() => {
  const c = heroCounts.value;
  return [...Array(c.semai).fill('semai'), ...Array(c.vegetatif).fill('vegetatif'), ...Array(c.siap).fill('siap'), ...Array(c.kosong).fill('kosong')];
});

const usedHoles = (i) => i.hole_status ? (i.hole_status.semai + i.hole_status.vegetatif + i.hole_status.panen) : 0;
function holesOf(i) {
  if (!i.hole_status) return [];
  const c = { semai: i.hole_status.semai, vegetatif: i.hole_status.vegetatif, siap: i.hole_status.panen, kosong: Math.max(0, (i.capacity || 0) - i.hole_status.semai - i.hole_status.vegetatif - i.hole_status.panen) };
  return [...Array(c.semai).fill('semai'), ...Array(c.vegetatif).fill('vegetatif'), ...Array(c.siap).fill('siap'), ...Array(c.kosong).fill('kosong')];
}

async function load() {
  loading.value = true;
  try {
    const [t, b, cal, summary] = await Promise.all([
      api('GET', '/api/tasks/today'),
      api('GET', '/api/batches?status=active'),
      api('GET', `/api/calendar?start=${todayStr()}&end=${addDays(todayStr(), 14)}`),
      api('GET', '/api/reports/summary').catch(() => null),
    ]);
    tasks.value = t;
    batches.value = b;
    upcoming.value = (cal.events || []).filter((e) => e.date > todayStr()).slice(0, 8);
    if (summary) {
      monthGrams.value = summary.per_month.find((m) => m.month === todayStr().slice(0, 7))?.weight_grams || 0;
    }
    const lastLog = await api('GET', '/api/logs?limit=1').catch(() => []);
    if (lastLog.length) { lastPh.value = lastLog[0].ph; lastName.value = auth.installations.find((i) => i.id === lastLog[0].installation_id)?.name || ''; }
    notifyDailyTasks(t.length);
  } catch { /* offline */ }
  finally { loading.value = false; }
}

async function complete(task) {
  try { await api('POST', `/api/tasks/${task.id}/complete`); tasks.value = tasks.value.filter((t) => t.id !== task.id); window.dispatchEvent(new CustomEvent('hg:refresh')); }
  catch (e) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: e.message })); }
}
function onLogSaved() { const t = logTask.value; logTask.value = null; if (t) complete(t); load(); }
function onSnoozed() { snoozeTask.value = null; load(); window.dispatchEvent(new CustomEvent('hg:refresh')); }
function onToast(m) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: m })); }

onMounted(async () => {
  if ('Notification' in window && Notification.permission === 'default') ensureNotificationPermission();
  load();
  window.addEventListener('hg:refresh', load);
});
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
