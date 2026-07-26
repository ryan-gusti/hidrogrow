<template>
  <Sheet title="💧 Catat pH / PPM" @close="$emit('close')">
    <form class="space-y-3" @submit.prevent="save">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Instalasi</label>
          <select v-model="form.installation_id" class="input" required @change="onInstallationChange">
            <option v-for="i in installations" :key="i.id" :value="i.id">{{ i.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Batch (opsional)</label>
          <select v-model="form.batch_id" class="input">
            <option :value="null">— Umum —</option>
            <option v-for="b in activeBatches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
      </div>
      <div>
        <label class="label">Tipe</label>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="t in types" :key="t.value" type="button"
            class="btn border !py-2 text-sm"
            :class="form.type === t.value ? 'border-leaf-500 bg-leaf-50 text-leaf-700 font-semibold' : 'border-gray-200 text-gray-600'"
            @click="form.type = t.value">{{ t.label }}</button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">pH</label>
          <input v-model.number="form.ph" type="number" step="0.1" min="0" max="14" class="input" placeholder="5.8" inputmode="decimal" />
        </div>
        <div>
          <label class="label">PPM / TDS</label>
          <input v-model.number="form.ppm" type="number" step="1" min="0" class="input" placeholder="850" inputmode="numeric" />
        </div>
        <div>
          <label class="label">Suhu air °C (opsional)</label>
          <input v-model.number="form.water_temp" type="number" step="0.5" class="input" placeholder="26" inputmode="decimal" />
        </div>
        <div>
          <label class="label">Volume ditambah (L)</label>
          <input v-model.number="form.volume_added" type="number" step="0.5" min="0" class="input" placeholder="0" inputmode="decimal" />
        </div>
      </div>
      <div v-if="rangeHint" class="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
        Target fase <b>{{ rangeHint.phase }}</b>: pH {{ rangeHint.ph_min }}–{{ rangeHint.ph_max }},
        PPM {{ rangeHint.ppm_min }}–{{ rangeHint.ppm_max }}
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="queued" class="text-sm text-amber-600">📴 Offline — log disimpan & akan disinkronkan saat online.</p>
      <button class="btn-primary w-full" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan Log' }}</button>
    </form>
  </Sheet>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { todayStr } from '../helpers';

const props = defineProps({
  presetBatchId: { type: Number, default: null },
  presetInstallationId: { type: Number, default: null },
  presetType: { type: String, default: 'cek' },
});
const emit = defineEmits(['close', 'saved']);

const types = [
  { value: 'cek', label: 'Cek Rutin' },
  { value: 'topup', label: 'Top-up' },
  { value: 'kuras', label: 'Kuras Total' },
];

const installations = ref([]);
const batches = ref([]);
const saving = ref(false);
const error = ref('');
const queued = ref(false);

const form = reactive({
  installation_id: props.presetInstallationId,
  batch_id: props.presetBatchId,
  ph: null, ppm: null, water_temp: null, volume_added: null,
  type: props.presetType,
});

const activeBatches = computed(() => batches.value.filter((b) => b.installation_id === form.installation_id && b.status === 'active'));

// Petunjuk rentang target fase saat ini untuk batch terpilih
const rangeHint = computed(() => {
  const b = batches.value.find((x) => x.id === form.batch_id);
  if (!b || !b.timeline) return null;
  const phase = b.timeline.phases.find((p) => todayStr() >= p.start && todayStr() < p.end) || b.timeline.phases.at(-1);
  return phase;
});

function onInstallationChange() {
  if (!activeBatches.value.some((b) => b.id === form.batch_id)) form.batch_id = null;
}

async function save() {
  error.value = '';
  if (form.ph == null && form.ppm == null && form.volume_added == null) {
    error.value = 'Isi minimal satu nilai (pH, PPM, atau volume)';
    return;
  }
  saving.value = true;
  try {
    const res = await api('POST', '/api/logs', { ...form, date: todayStr() });
    if (res?.queued) queued.value = true;
    else emit('saved');
    setTimeout(() => emit('close'), queued.value ? 800 : 0);
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  const [inst, b] = await Promise.all([api('GET', '/api/installations'), api('GET', '/api/batches?status=active')]);
  installations.value = inst;
  batches.value = b;
  if (!form.installation_id && inst.length) form.installation_id = inst[0].id;
});
</script>
