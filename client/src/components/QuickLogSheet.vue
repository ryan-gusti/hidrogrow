<template>
  <Sheet title="Catat Log Nutrisi" :sub="task ? 'Dari tugas: ' + task.title + ' — nilai langsung masuk grafik tren.' : 'Form cepat — cukup pH & PPM, sisanya opsional.'" @close="$emit('close')">
    <div class="field"><label>Instalasi</label>
      <select v-model="form.installation_id" class="input" required @change="onInstallationChange">
        <option v-for="i in installations" :key="i.id" :value="i.id">{{ i.name }}</option>
      </select>
    </div>
    <div class="field"><label>Batch (opsional)</label>
      <select v-model="form.batch_id" class="input">
        <option :value="null">— Umum —</option>
        <option v-for="b in activeBatches" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>
    </div>
    <div class="frow">
      <div class="field"><label>pH</label><input v-model="phRaw" type="text" inputmode="decimal" placeholder="6,0" /></div>
      <div class="field"><label>PPM / TDS</label><input v-model.number="form.ppm" type="number" inputmode="numeric" step="10" min="0" placeholder="1100" /></div>
    </div>
    <div class="frow">
      <div class="field"><label>Suhu air (°C, opsional)</label><input v-model.number="form.water_temp" type="number" inputmode="decimal" step="0.5" placeholder="27" /></div>
      <div class="field"><label>Tipe</label>
        <select v-model="form.type" class="input" @change="onTypeChange">
          <option value="cek">Cek rutin</option>
          <option value="topup">Top-up air</option>
          <option value="kuras">Kuras total</option>
        </select>
      </div>
    </div>
    <div v-if="form.type !== 'cek'" class="field"><label>Volume ditambah (liter)</label><input v-model.number="form.volume_added" type="number" inputmode="numeric" min="0" placeholder="5" /></div>
    <PhotoInput label="Foto (opsional)" @uploaded="(url) => (form.photo = url)" @toast="(m) => emit('toast', m)" />
    <div v-if="indicator" style="margin:2px 0 14px" v-html="indicator"></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary" style="flex:1" @click="$emit('close')">Batal</button>
      <button class="btn btn-primary" style="flex:2" :disabled="saving" @click="save">{{ saving ? 'Menyimpan…' : 'Simpan log' }}</button>
    </div>
  </Sheet>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import Sheet from './Sheet.vue';
import PhotoInput from './PhotoInput.vue';
import { api } from '../api';
import { todayStr } from '../helpers';

const props = defineProps({
  presetBatchId: { type: Number, default: null },
  presetInstallationId: { type: Number, default: null },
  presetType: { type: String, default: 'cek' },
  task: { type: Object, default: null },
});
const emit = defineEmits(['close', 'saved', 'toast']);

const installations = ref([]);
const batches = ref([]);
const saving = ref(false);
const phRaw = ref('');

const form = reactive({
  installation_id: props.presetInstallationId,
  batch_id: props.presetBatchId,
  ph: null, ppm: null, water_temp: null, volume_added: null, photo: null,
  type: props.presetType,
});

const activeBatches = computed(() => batches.value.filter((b) => b.installation_id === form.installation_id && b.status === 'active'));

const rangeHint = computed(() => {
  const b = batches.value.find((x) => x.id === form.batch_id);
  if (!b || !b.timeline) return null;
  return b.timeline.phases.find((p) => todayStr() >= p.start && todayStr() < p.end) || b.timeline.phases.at(-1);
});

const phVal = computed(() => { const v = parseFloat(String(phRaw.value).replace(',', '.')); return isNaN(v) ? null : v; });

const indicator = computed(() => {
  if (phVal.value == null || form.ppm == null) return '';
  const ok = rangeHint.value
    ? phVal.value >= rangeHint.value.ph_min && phVal.value <= rangeHint.value.ph_max && form.ppm >= rangeHint.value.ppm_min && form.ppm <= rangeHint.value.ppm_max
    : phVal.value >= 5.5 && phVal.value <= 6.5 && form.ppm >= 840 && form.ppm <= 1400;
  if (ok) return '<span class="badge b-ok"><span class="dot"></span>Dalam rentang target</span>';
  const warn = phVal.value >= 5.2 && phVal.value <= 6.9;
  return warn ? '<span class="badge b-warn"><span class="dot"></span>Mendekati batas — sesuaikan bertahap</span>'
    : '<span class="badge b-bad"><span class="dot"></span>Di luar rentang — koreksi dengan air atau pekatan</span>';
});

function onInstallationChange() { if (!activeBatches.value.some((b) => b.id === form.batch_id)) form.batch_id = null; }
function onTypeChange() { if (form.type === 'cek') form.volume_added = null; }

async function save() {
  form.ph = phVal.value;
  if (form.ph == null && form.ppm == null && form.volume_added == null) { emit('toast', 'Isi minimal satu nilai (pH, PPM, atau volume).'); return; }
  if (form.ph != null && (form.ph < 3 || form.ph > 9)) { emit('toast', 'Isi pH yang valid (3–9).'); return; }
  if (form.ppm != null && (form.ppm < 0 || form.ppm > 3000)) { emit('toast', 'Isi PPM yang valid (0–3000).'); return; }
  saving.value = true;
  try {
    const res = await api('POST', '/api/logs', { ...form, ph: form.ph, date: todayStr() });
    if (res?.queued) { emit('toast', '📴 Offline — log disimpan & akan disinkronkan saat online.'); setTimeout(() => emit('close'), 600); }
    else { emit('toast', props.task ? 'Log tersimpan — tugas ditandai selesai.' : 'Log nutrisi tersimpan.'); emit('saved'); }
  } catch (err) { emit('toast', err.message); }
  finally { saving.value = false; }
}

onMounted(async () => {
  const [inst, b] = await Promise.all([api('GET', '/api/installations'), api('GET', '/api/batches?status=active')]);
  installations.value = inst; batches.value = b;
  if (!form.installation_id && inst.length) form.installation_id = inst[0].id;
});
</script>
