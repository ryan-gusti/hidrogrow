<template>
  <form class="card space-y-3" @submit.prevent="save">
    <h2 class="font-bold">{{ initial ? 'Ubah Instalasi' : 'Instalasi Baru' }}</h2>
    <div>
      <label class="label">Nama instalasi</label>
      <input v-model="form.name" type="text" class="input" required placeholder="cth: NFT Teras" />
    </div>
    <div>
      <label class="label">Jenis sistem</label>
      <select v-model="form.system_type" class="input" required>
        <option v-for="t in SYSTEM_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">Jumlah lubang tanam</label>
        <input v-model.number="form.capacity" type="number" min="0" class="input" inputmode="numeric" placeholder="24" />
      </div>
      <div>
        <label class="label">Volume tandon (liter)</label>
        <input v-model.number="form.reservoir_volume" type="number" step="0.5" min="0" class="input" inputmode="decimal" placeholder="40" />
      </div>
    </div>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <button class="btn-primary w-full" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan Instalasi' }}</button>
  </form>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { api } from '../api';
import { SYSTEM_TYPES } from '../helpers';

const props = defineProps({ initial: { type: Object, default: null } });
const emit = defineEmits(['saved']);

const form = reactive({
  name: props.initial?.name || '',
  system_type: props.initial?.system_type || 'wick',
  capacity: props.initial?.capacity ?? null,
  reservoir_volume: props.initial?.reservoir_volume ?? null,
});

const saving = ref(false);
const error = ref('');

async function save() {
  error.value = '';
  saving.value = true;
  try {
    if (props.initial) await api('PUT', `/api/installations/${props.initial.id}`, form);
    else await api('POST', '/api/installations', form);
    emit('saved');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>
