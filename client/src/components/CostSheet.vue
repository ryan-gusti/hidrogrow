<template>
  <Sheet title="💰 Tambah Biaya" @close="$emit('close')">
    <form class="space-y-3" @submit.prevent="save">
      <div>
        <label class="label">Tanggal</label>
        <input v-model="date" type="date" class="input" required />
      </div>
      <div>
        <label class="label">Deskripsi</label>
        <input v-model="description" type="text" class="input" required placeholder="cth: Benih pakcoy 1 pack" />
      </div>
      <div>
        <label class="label">Jumlah (Rp)</label>
        <input v-model.number="amount" type="number" min="0" step="500" class="input" required inputmode="numeric" placeholder="15000" />
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan Biaya' }}</button>
    </form>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { todayStr } from '../helpers';

const props = defineProps({ batchId: { type: Number, required: true } });
const emit = defineEmits(['close', 'saved']);

const date = ref(todayStr());
const description = ref('');
const amount = ref(null);
const saving = ref(false);
const error = ref('');

async function save() {
  error.value = '';
  saving.value = true;
  try {
    await api('POST', '/api/notes/costs', { batch_id: props.batchId, date: date.value, description: description.value, amount: amount.value });
    emit('saved');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>
