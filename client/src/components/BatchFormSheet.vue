<template>
  <Sheet title="Batch Tanam Baru" sub="Timeline fase & reminder otomatis dibuat dari template tanaman." @close="$emit('close')">
    <div class="field"><label>Tanaman</label>
      <select v-model="form.plant_template_id" class="input" required>
        <option v-for="p in plants" :key="p.id" :value="p.id">{{ p.name }}{{ p.is_custom ? ' (kustom)' : '' }}</option>
      </select>
      <p v-if="selectedPlant?.tips" class="hint">💡 {{ selectedPlant.tips }}</p>
    </div>
    <div class="frow">
      <div class="field"><label>Tanggal semai</label><input v-model="form.sow_date" type="date" required /></div>
      <div class="field"><label>Jumlah bibit</label><input v-model.number="form.quantity" type="number" inputmode="numeric" min="1" required /></div>
    </div>
    <div class="field"><label>Instalasi tujuan</label>
      <select v-model="form.installation_id" class="input" required>
        <option v-for="i in installations" :key="i.id" :value="i.id">{{ i.name }}</option>
      </select>
    </div>
    <details style="margin-bottom:14px">
      <summary style="cursor:pointer;font-size:13px;font-weight:500;color:var(--muted);padding:8px 0">Sesuaikan durasi & interval (opsional)</summary>
      <div v-if="selectedPlant" style="margin-top:10px">
        <p class="hint" style="margin:0 0 6px">Durasi tiap fase (hari)</p>
        <div class="frow" style="gap:8px;margin-bottom:10px">
          <div v-for="(p, i) in selectedPlant.phases" :key="i" class="field" style="margin:0">
            <label style="font-size:11px">{{ p.name }}</label>
            <input v-model.number="overrides[i]" type="number" inputmode="numeric" min="1" />
          </div>
        </div>
        <div class="frow">
          <div class="field" style="margin:0"><label>Cek nutrisi tiap (hari)</label><input v-model.number="form.check_interval" type="number" inputmode="numeric" min="1" /></div>
          <div class="field" style="margin:0"><label>Ganti larutan tiap (hari)</label><input v-model.number="form.replace_interval" type="number" inputmode="numeric" min="1" /></div>
        </div>
      </div>
    </details>
    <div v-if="preview" class="card" style="padding:12px 14px;margin-bottom:14px;font-size:13px;color:var(--muted)">
      <span class="badge b-pindah" style="margin:0 6px 6px 0"><span class="dot"></span>Pindah {{ preview.transplant }}</span>
      <span class="badge b-panen" style="margin:0 6px 6px 0"><span class="dot"></span>Panen ± {{ preview.harvest }}</span>
      <span class="badge b-cek"><span class="dot"></span>Cek nutrisi tiap {{ form.check_interval }} hari</span>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary" style="flex:1" @click="$emit('close')">Batal</button>
      <button class="btn btn-primary" style="flex:2" :disabled="saving" @click="save">{{ saving ? 'Menyimpan…' : 'Buat batch' }}</button>
    </div>
  </Sheet>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { todayStr, addDays, formatShort } from '../helpers';

const props = defineProps({ presetDate: { type: String, default: null } });
const emit = defineEmits(['close', 'saved', 'toast']);

const plants = ref([]);
const installations = ref([]);
const saving = ref(false);
const overrides = ref([]);

const form = reactive({
  plant_template_id: null, sow_date: props.presetDate || todayStr(),
  quantity: 12, installation_id: null, check_interval: 2, replace_interval: 14,
});

const selectedPlant = computed(() => plants.value.find((p) => p.id === form.plant_template_id));
watch(selectedPlant, (p) => { overrides.value = p ? p.phases.map((x) => x.days) : []; });

const preview = computed(() => {
  const p = selectedPlant.value;
  if (!p || !form.sow_date || overrides.value.length !== p.phases.length) return null;
  const total = (n) => overrides.value.slice(0, n).reduce((s, x) => s + (x || 0), 0);
  return { transplant: formatShort(addDays(form.sow_date, total(1))), harvest: formatShort(addDays(form.sow_date, total(p.phases.length - 1))) };
});

async function save() {
  if (!form.sow_date) { emit('toast', 'Pilih tanggal semai.'); return; }
  if (!form.quantity || form.quantity < 1) { emit('toast', 'Isi jumlah bibit.'); return; }
  saving.value = true;
  try {
    const def = selectedPlant.value.phases.map((x) => x.days);
    const custom = overrides.value.some((v, i) => v !== def[i]);
    await api('POST', '/api/batches', { ...form, phase_overrides: custom ? overrides.value : null });
    emit('toast', 'Batch dibuat — reminder otomatis aktif.');
    emit('saved');
  } catch (err) { emit('toast', err.message); }
  finally { saving.value = false; }
}

onMounted(async () => {
  const [p, i] = await Promise.all([api('GET', '/api/plants'), api('GET', '/api/installations')]);
  plants.value = p; installations.value = i;
  if (p.length) form.plant_template_id = p[0].id;
  if (i.length) form.installation_id = i[0].id;
});
</script>
