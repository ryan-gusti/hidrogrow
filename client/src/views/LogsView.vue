<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <select v-model="filterInstallation" class="input !w-auto flex-1" @change="load">
        <option :value="null">Semua instalasi</option>
        <option v-for="i in installations" :key="i.id" :value="i.id">{{ i.name }}</option>
      </select>
      <button class="btn-primary !min-h-0 !py-2 text-sm" @click="logSheet = true">+ Log</button>
    </div>

    <div class="flex rounded-xl bg-gray-100 p-1">
      <button class="flex-1 rounded-lg py-2 text-sm font-medium" :class="tab === 'list' ? 'bg-white shadow text-leaf-700' : 'text-gray-500'" @click="tab = 'list'">Riwayat</button>
      <button class="flex-1 rounded-lg py-2 text-sm font-medium" :class="tab === 'trend' ? 'bg-white shadow text-leaf-700' : 'text-gray-500'" @click="tab = 'trend'">Grafik Tren</button>
      <button class="flex-1 rounded-lg py-2 text-sm font-medium" :class="tab === 'calc' ? 'bg-white shadow text-leaf-700' : 'text-gray-500'" @click="tab = 'calc'">Kalkulator AB Mix</button>
    </div>

    <!-- Riwayat -->
    <div v-if="tab === 'list'" class="space-y-2">
      <p v-if="!logs.length" class="card py-10 text-center text-sm text-gray-400">Belum ada log. Catat pengecekan pertamamu!</p>
      <div v-for="l in logs" :key="l.id" class="card !p-3">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium">{{ formatId(l.date) }}</p>
          <div class="flex items-center gap-2">
            <span class="chip" :class="typeChip(l.type)">{{ typeLabel(l.type) }}</span>
            <button class="text-gray-300 hover:text-red-500" @click="remove(l)">🗑</button>
          </div>
        </div>
        <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span v-if="l.ph != null" :class="flagClass(l.ph_flag)">pH {{ l.ph }} {{ flagIcon(l.ph_flag) }}</span>
          <span v-if="l.ppm != null" :class="flagClass(l.ppm_flag)">PPM {{ l.ppm }} {{ flagIcon(l.ppm_flag) }}</span>
          <span v-if="l.water_temp != null" class="text-gray-600">🌡 {{ l.water_temp }}°C</span>
          <span v-if="l.volume_added != null" class="text-gray-600">+{{ l.volume_added }} L</span>
        </div>
        <p v-if="l.range" class="mt-1 text-xs text-gray-400">
          Target fase {{ l.range.phase }}: pH {{ l.range.ph_min }}–{{ l.range.ph_max }} · PPM {{ l.range.ppm_min }}–{{ l.range.ppm_max }}
        </p>
        <p v-if="l.note" class="mt-1 text-xs text-gray-500">{{ l.note }}</p>
      </div>
    </div>

    <!-- Grafik tren -->
    <div v-else-if="tab === 'trend'" class="space-y-3">
      <div v-if="!filterInstallation" class="card py-8 text-center text-sm text-gray-400">
        Pilih instalasi di atas untuk melihat grafik tren pH & PPM.
      </div>
      <template v-else>
        <div class="card"><p class="mb-2 text-sm font-bold">Tren pH</p><canvas ref="phCanvas" /></div>
        <div class="card"><p class="mb-2 text-sm font-bold">Tren PPM</p><canvas ref="ppmCanvas" /></div>
        <p v-if="!trendData.length" class="text-center text-sm text-gray-400">Belum ada data untuk instalasi ini.</p>
      </template>
    </div>

    <!-- Kalkulator AB Mix -->
    <div v-else class="card space-y-3">
      <h3 class="font-bold">🧪 Kalkulator Nutrisi AB Mix</h3>
      <p class="text-xs text-gray-500">Asumsi umum: ±5 ml pekatan A + 5 ml B per liter menaikkan ±1000 PPM (sesuaikan label produk Anda).</p>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Volume tandon (L)</label>
          <input v-model.number="calc.volume" type="number" min="1" class="input" inputmode="numeric" />
        </div>
        <div>
          <label class="label">Target PPM</label>
          <input v-model.number="calc.target" type="number" min="0" step="50" class="input" inputmode="numeric" />
        </div>
        <div>
          <label class="label">PPM saat ini</label>
          <input v-model.number="calc.current" type="number" min="0" class="input" inputmode="numeric" />
        </div>
        <div>
          <label class="label">Konsentrasi (ml/L per 1000 PPM)</label>
          <input v-model.number="calc.ratio" type="number" min="0.5" step="0.5" class="input" inputmode="decimal" />
        </div>
      </div>
      <div v-if="calcResult" class="rounded-xl bg-leaf-50 p-4 text-center">
        <p class="text-sm text-leaf-800">Tambahkan masing-masing</p>
        <p class="text-2xl font-bold text-leaf-700">{{ calcResult }} ml</p>
        <p class="text-sm text-leaf-800">pekatan <b>A</b> dan <b>B</b> (larutkan A dulu, aduk, lalu B)</p>
      </div>
      <p v-else-if="calc.current >= calc.target && calc.target" class="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
        PPM saat ini sudah ≥ target — tidak perlu penambahan pekatan.
      </p>
    </div>

    <QuickLogSheet v-if="logSheet" :preset-installation-id="filterInstallation" @close="logSheet = false" @saved="onSaved" />
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import { api } from '../api';
import { formatId } from '../helpers';
import QuickLogSheet from '../components/QuickLogSheet.vue';

const installations = ref([]);
const logs = ref([]);
const filterInstallation = ref(null);
const tab = ref('list');
const logSheet = ref(false);
const trendData = ref([]);
const phCanvas = ref(null);
const ppmCanvas = ref(null);
let charts = [];

const calc = reactive({ volume: 40, target: 1000, current: 0, ratio: 5 });
import { computed } from 'vue';
const calcResult = computed(() => {
  if (!calc.volume || !calc.target || calc.current == null || !calc.ratio) return null;
  const gap = calc.target - calc.current;
  if (gap <= 0) return null;
  return Math.round(((gap / 1000) * calc.ratio * calc.volume) * 10) / 10;
});

const typeLabel = (t) => ({ cek: 'Cek Rutin', topup: 'Top-up', kuras: 'Kuras' }[t] || t);
const typeChip = (t) => ({ cek: 'bg-blue-50 text-blue-600', topup: 'bg-leaf-50 text-leaf-600', kuras: 'bg-red-50 text-red-600' }[t] || 'bg-gray-100');
const flagClass = (f) => ({ green: 'text-green-600 font-semibold', yellow: 'text-yellow-600 font-semibold', red: 'text-red-600 font-semibold' }[f] || 'text-gray-700');
const flagIcon = (f) => ({ green: '●', yellow: '●', red: '●' }[f] || '');

async function load() {
  try {
    const params = filterInstallation.value ? `?installation_id=${filterInstallation.value}` : '';
    logs.value = await api('GET', `/api/logs${params}`);
    if (filterInstallation.value) {
      trendData.value = await api('GET', `/api/logs/trend?installation_id=${filterInstallation.value}`);
      if (tab.value === 'trend') renderCharts();
    }
  } catch { /* offline */ }
}

async function renderCharts() {
  await nextTick();
  charts.forEach((c) => c.destroy());
  charts = [];
  if (!phCanvas.value || !ppmCanvas.value) return;
  const labels = trendData.value.map((d) => d.date.slice(5));
  const mk = (canvas, key, color) => new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ data: trendData.value.map((d) => d[key]), borderColor: color, backgroundColor: color + '22', fill: true, tension: 0.3, spanGaps: true, pointRadius: 3 }] },
    options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 8 } } }, maintainAspectRatio: true },
  });
  charts.push(mk(phCanvas.value, 'ph', '#16a34a'));
  charts.push(mk(ppmCanvas.value, 'ppm', '#2563eb'));
}

watch(tab, (t) => { if (t === 'trend') renderCharts(); });

async function remove(l) {
  if (!confirm('Hapus log ini?')) return;
  await api('DELETE', `/api/logs/${l.id}`);
  load();
}

function onSaved() {
  logSheet.value = false;
  load();
  window.dispatchEvent(new CustomEvent('hg:refresh'));
}

onMounted(async () => {
  installations.value = await api('GET', '/api/installations').catch(() => []);
  load();
  window.addEventListener('hg:refresh', load);
});
onUnmounted(() => {
  window.removeEventListener('hg:refresh', load);
  charts.forEach((c) => c.destroy());
});
</script>
