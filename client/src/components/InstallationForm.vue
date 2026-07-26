<template>
  <Sheet :title="initial ? 'Ubah Instalasi' : 'Instalasi Baru'" @close="$emit('close')">
    <form @submit.prevent="save">
      <div class="field"><label>Nama instalasi</label><input v-model="form.name" type="text" required placeholder="cth: NFT Teras" /></div>
      <div class="field"><label>Jenis sistem</label>
        <select v-model="form.system_type" class="input" required>
          <option v-for="t in SYSTEM_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="frow">
        <div class="field"><label>Jumlah lubang tanam</label><input v-model.number="form.capacity" type="number" inputmode="numeric" min="0" placeholder="24" /></div>
        <div class="field"><label>Volume tandon (liter)</label><input v-model.number="form.reservoir_volume" type="number" inputmode="decimal" step="0.5" min="0" placeholder="40" /></div>
      </div>
      <button class="btn btn-primary" style="width:100%" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan Instalasi' }}</button>
    </form>
  </Sheet>
</template>

<script setup>
import { reactive, ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { SYSTEM_TYPES } from '../helpers';

const props = defineProps({ initial: { type: Object, default: null } });
const emit = defineEmits(['close', 'saved', 'toast']);

const form = reactive({
  name: props.initial?.name || '', system_type: props.initial?.system_type || 'wick',
  capacity: props.initial?.capacity ?? null, reservoir_volume: props.initial?.reservoir_volume ?? null,
});
const saving = ref(false);

async function save() {
  saving.value = true;
  try {
    if (props.initial) await api('PUT', `/api/installations/${props.initial.id}`, form);
    else await api('POST', '/api/installations', form);
    emit('toast', 'Instalasi tersimpan.');
    emit('saved');
  } catch (e) { emit('toast', e.message); }
  finally { saving.value = false; }
}
</script>
