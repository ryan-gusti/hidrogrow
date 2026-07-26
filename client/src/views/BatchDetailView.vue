<template>
  <div v-if="batch" class="space-y-4">
    <button class="text-sm text-leaf-600" @click="$router.back()">← Kembali</button>

    <div class="card space-y-3">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-xl font-bold">{{ batch.name }}</h2>
          <p class="text-sm text-gray-500">
            {{ batch.plant_name }} · {{ batch.quantity }} tanaman · Hari ke-{{ batch.day_number }}
          </p>
        </div>
        <span class="chip" :class="statusChip">{{ statusLabel }}</span>
      </div>
      <PhaseBar :batch="batch" />

      <!-- Timeline detail fase -->
      <div class="space-y-1 pt-1">
        <div v-for="(p, i) in batch.timeline.phases" :key="i" class="flex items-center gap-2 text-sm">
          <span class="h-2.5 w-2.5 rounded-full" :class="phaseDot(p)" />
          <span class="w-28 font-medium" :class="{ 'text-leaf-700': isCurrent(p) }">{{ p.name }}</span>
          <span class="text-xs text-gray-500">{{ formatShort(p.start) }} – {{ formatShort(p.end) }} ({{ p.days }} hari)</span>
          <span v-if="isCurrent(p)" class="chip bg-leaf-100 text-leaf-700 text-[10px]">saat ini</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center text-sm">
        <div><p class="font-bold">{{ totalHarvest }} g</p><p class="text-xs text-gray-500">Total panen</p></div>
        <div><p class="font-bold">{{ batch.harvests.length }}x</p><p class="text-xs text-gray-500">Panen</p></div>
        <div><p class="font-bold">Rp {{ totalCost.toLocaleString('id-ID') }}</p><p class="text-xs text-gray-500">Biaya</p></div>
      </div>
    </div>

    <!-- Aksi batch -->
    <div v-if="batch.status === 'active'" class="grid grid-cols-3 gap-2">
      <button class="btn-secondary !px-2 text-sm" @click="harvestSheet = true">🧺 Panen</button>
      <button class="btn-secondary !px-2 text-sm" @click="noteSheet = true">📝 Catatan</button>
      <button class="btn-danger !px-2 text-sm" @click="failSheet = true">✖ Gagal</button>
    </div>
    <button v-if="batch.status === 'active'" class="btn-ghost w-full text-sm" @click="costSheet = true">💰 Tambah biaya</button>

    <!-- Task pending batch -->
    <div v-if="batch.tasks.length" class="space-y-2">
      <h3 class="font-bold">Jadwal Berikutnya</h3>
      <div v-for="t in batch.tasks" :key="t.id" class="card flex items-center gap-2 !p-3 text-sm">
        <span class="h-2.5 w-2.5 rounded-full" :class="(EVENT_META[t.type] || EVENT_META.lainnya).dot" />
        <span class="flex-1">{{ t.title }}</span>
        <span class="text-xs text-gray-500">{{ formatShort(t.due_date) }}<template v-if="t.recurrence_days"> · tiap {{ t.recurrence_days }}h</template></span>
      </div>
    </div>

    <!-- Riwayat panen -->
    <div v-if="batch.harvests.length" class="space-y-2">
      <h3 class="font-bold">Riwayat Panen</h3>
      <div v-for="h in batch.harvests" :key="h.id" class="card flex gap-3 !p-3">
        <img v-if="h.photo" :src="h.photo" class="h-16 w-16 rounded-xl object-cover" alt="Foto panen" />
        <div class="flex-1 text-sm">
          <p class="font-medium">{{ formatId(h.date) }}</p>
          <p class="text-gray-600">
            <template v-if="h.quantity">{{ h.quantity }} {{ h.unit }}</template>
            <template v-if="h.quantity && h.weight_grams"> · </template>
            <template v-if="h.weight_grams">{{ h.weight_grams }} g</template>
          </p>
          <p v-if="h.notes" class="text-xs text-gray-400">{{ h.notes }}</p>
        </div>
      </div>
    </div>

    <!-- Catatan harian -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="font-bold">Catatan Harian</h3>
        <button class="text-sm font-medium text-leaf-600" @click="noteSheet = true">+ Tambah</button>
      </div>
      <p v-if="!batch.notes.length" class="text-sm text-gray-400">Belum ada catatan.</p>
      <div v-for="n in batch.notes" :key="n.id" class="card flex gap-3 !p-3">
        <img v-if="n.photo" :src="n.photo" class="h-16 w-16 rounded-xl object-cover" alt="Foto catatan" />
        <div class="flex-1 text-sm">
          <p class="text-xs text-gray-400">{{ formatId(n.date) }}</p>
          <p>{{ n.text }}</p>
        </div>
      </div>
    </div>

    <HarvestSheet v-if="harvestSheet" :preset-batch-id="batch.id" @close="harvestSheet = false" @saved="onSaved" />
    <NoteSheet v-if="noteSheet" :batch-id="batch.id" @close="noteSheet = false" @saved="onSaved" />
    <CostSheet v-if="costSheet" :batch-id="batch.id" @close="costSheet = false" @saved="onSaved" />
    <Sheet v-if="failSheet" title="Tandai Batch Gagal" @close="failSheet = false">
      <div class="space-y-3">
        <p class="text-sm text-gray-600">Catat alasan kegagalan untuk pembelajaran siklus berikutnya.</p>
        <textarea v-model="failReason" class="input" rows="3" placeholder="cth: Busuk akar karena suhu air terlalu tinggi"></textarea>
        <p v-if="failError" class="text-sm text-red-600">{{ failError }}</p>
        <button class="btn-danger w-full" @click="markFailed">Tandai Gagal & Tutup Batch</button>
      </div>
    </Sheet>
  </div>
  <div v-else class="py-10 text-center text-gray-400">Memuat…</div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import { EVENT_META, formatId, formatShort, todayStr } from '../helpers';
import PhaseBar from '../components/PhaseBar.vue';
import HarvestSheet from '../components/HarvestSheet.vue';
import NoteSheet from '../components/NoteSheet.vue';
import CostSheet from '../components/CostSheet.vue';
import Sheet from '../components/Sheet.vue';

const route = useRoute();
const batch = ref(null);
const harvestSheet = ref(false);
const noteSheet = ref(false);
const costSheet = ref(false);
const failSheet = ref(false);
const failReason = ref('');
const failError = ref('');

const statusLabel = computed(() => ({ active: batch.value.current_phase, done: 'Selesai', failed: 'Gagal' }[batch.value.status]));
const statusChip = computed(() =>
  batch.value.status === 'active' ? 'bg-leaf-100 text-leaf-700' : batch.value.status === 'done' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'
);
const totalHarvest = computed(() => batch.value.harvests.reduce((s, h) => s + (h.weight_grams || 0), 0));
const totalCost = computed(() => batch.value.costs.reduce((s, c) => s + c.amount, 0));

const isCurrent = (p) => batch.value.status === 'active' && todayStr() >= p.start && todayStr() < p.end;
const phaseDot = (p) => (todayStr() >= p.end ? 'bg-gray-400' : isCurrent(p) ? 'bg-leaf-500' : 'bg-gray-200');

async function load() {
  try {
    batch.value = await api('GET', `/api/batches/${route.params.id}`);
  } catch { /* offline */ }
}

function onSaved() {
  harvestSheet.value = false;
  noteSheet.value = false;
  costSheet.value = false;
  load();
  window.dispatchEvent(new CustomEvent('hg:refresh'));
}

async function markFailed() {
  failError.value = '';
  try {
    await api('POST', `/api/batches/${batch.value.id}/fail`, { reason: failReason.value });
    failSheet.value = false;
    load();
    window.dispatchEvent(new CustomEvent('hg:refresh'));
  } catch (err) {
    failError.value = err.message;
  }
}

onMounted(() => {
  load();
  window.addEventListener('hg:refresh', load);
});
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
