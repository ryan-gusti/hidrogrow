<template>
  <div class="space-y-4">
    <div class="flex rounded-xl bg-gray-100 p-1">
      <button class="flex-1 rounded-lg py-2 text-sm font-medium" :class="tab === 'batch' ? 'bg-white shadow text-leaf-700' : 'text-gray-500'" @click="tab = 'batch'">Batch Aktif</button>
      <button class="flex-1 rounded-lg py-2 text-sm font-medium" :class="tab === 'catalog' ? 'bg-white shadow text-leaf-700' : 'text-gray-500'" @click="tab = 'catalog'">Katalog Tanaman</button>
      <button class="flex-1 rounded-lg py-2 text-sm font-medium" :class="tab === 'history' ? 'bg-white shadow text-leaf-700' : 'text-gray-500'" @click="tab = 'history'">Riwayat</button>
    </div>

    <!-- TAB: Batch aktif -->
    <div v-if="tab === 'batch'" class="space-y-3">
      <button class="btn-primary w-full" @click="batchSheet = true">+ Batch Baru</button>
      <div v-if="active.length === 0" class="card py-10 text-center">
        <span class="text-4xl">🌱</span>
        <p class="mt-2 font-medium">Belum ada batch aktif</p>
        <p class="text-sm text-gray-500">Mulai semai batch pertamamu!</p>
      </div>
      <router-link v-for="b in active" :key="b.id" :to="`/tanam/${b.id}`" class="card block space-y-2">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-bold">{{ b.name }}</p>
            <p class="text-xs text-gray-500">{{ b.quantity }} tanaman · Hari ke-{{ b.day_number }}</p>
          </div>
          <span class="chip bg-leaf-100 text-leaf-700">{{ b.current_phase }}</span>
        </div>
        <PhaseBar :batch="b" />
      </router-link>
    </div>

    <!-- TAB: Katalog -->
    <div v-else-if="tab === 'catalog'" class="space-y-3">
      <button class="btn-secondary w-full" @click="plantSheet = true">+ Tanaman Kustom</button>
      <div v-for="p in plants" :key="p.id" class="card space-y-2">
        <div class="flex items-center justify-between">
          <p class="font-bold">{{ p.name }}</p>
          <div class="flex items-center gap-2">
            <span class="chip bg-gray-100 text-gray-600">±{{ totalDays(p) }} hari</span>
            <button v-if="p.is_custom" class="btn-ghost !min-h-0 p-1 text-sm" @click="editPlant(p)">✏️</button>
          </div>
        </div>
        <div class="flex gap-1 text-xs">
          <span v-for="(ph, i) in p.phases" :key="i" class="chip bg-leaf-50 text-leaf-700">{{ ph.name }} {{ ph.days }}h</span>
        </div>
        <p class="text-xs text-gray-500">pH {{ p.phases[0].ph_min }}–{{ p.phases[0].ph_max }} · PPM {{ p.phases.at(-1).ppm_min }}–{{ p.phases.at(-1).ppm_max }}</p>
        <p v-if="p.tips" class="text-xs text-gray-400">💡 {{ p.tips }}</p>
      </div>
    </div>

    <!-- TAB: Riwayat -->
    <div v-else class="space-y-2">
      <div v-if="history.length === 0" class="card py-10 text-center text-sm text-gray-400">
        Belum ada batch yang selesai atau gagal.
      </div>
      <router-link v-for="b in history" :key="b.id" :to="`/tanam/${b.id}`" class="card flex items-center justify-between !p-3">
        <div>
          <p class="font-medium">{{ b.name }}</p>
          <p class="text-xs text-gray-500">Semai {{ formatShort(b.sow_date) }}<template v-if="b.status === 'failed'"> · {{ b.fail_reason }}</template></p>
        </div>
        <span class="chip" :class="b.status === 'done' ? 'bg-leaf-100 text-leaf-700' : 'bg-red-100 text-red-600'">
          {{ b.status === 'done' ? 'Selesai' : 'Gagal' }}
        </span>
      </router-link>
    </div>

    <BatchFormSheet v-if="batchSheet" @close="batchSheet = false" @saved="onSaved" />
    <PlantFormSheet v-if="plantSheet" :initial="editingPlant" @close="closePlantSheet" @saved="onSaved" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { formatShort } from '../helpers';
import PhaseBar from '../components/PhaseBar.vue';
import BatchFormSheet from '../components/BatchFormSheet.vue';
import PlantFormSheet from '../components/PlantFormSheet.vue';

const tab = ref('batch');
const batches = ref([]);
const plants = ref([]);
const batchSheet = ref(false);
const plantSheet = ref(false);
const editingPlant = ref(null);

const active = computed(() => batches.value.filter((b) => b.status === 'active'));
const history = computed(() => batches.value.filter((b) => b.status !== 'active'));

function totalDays(p) { return p.phases.reduce((s, x) => s + x.days, 0); }

function editPlant(p) {
  editingPlant.value = p;
  plantSheet.value = true;
}

function closePlantSheet() {
  plantSheet.value = false;
  editingPlant.value = null;
}

async function load() {
  try {
    [batches.value, plants.value] = await Promise.all([
      api('GET', '/api/batches'),
      api('GET', '/api/plants'),
    ]);
  } catch { /* offline */ }
}

function onSaved() {
  batchSheet.value = false;
  closePlantSheet();
  load();
  window.dispatchEvent(new CustomEvent('hg:refresh'));
}

onMounted(() => {
  load();
  window.addEventListener('hg:refresh', load);
});
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
