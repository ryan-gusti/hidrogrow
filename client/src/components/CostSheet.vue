<template>
  <Sheet title="Tambah Biaya" @close="$emit('close')">
    <form @submit.prevent="save">
      <div class="field"><label>Tanggal</label><input v-model="date" type="date" required /></div>
      <div class="field"><label>Deskripsi</label><input v-model="description" type="text" required placeholder="cth: Benih pakcoy 1 pack" /></div>
      <div class="field"><label>Jumlah (Rp)</label><input v-model.number="amount" type="number" inputmode="numeric" min="0" step="500" required placeholder="15000" /></div>
      <div style="display:flex;gap:10px">
        <button type="button" class="btn btn-secondary" style="flex:1" @click="$emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" style="flex:2" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
      </div>
    </form>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { todayStr } from '../helpers';

const props = defineProps({ batchId: { type: Number, required: true } });
const emit = defineEmits(['close', 'saved', 'toast']);
const date = ref(todayStr());
const description = ref('');
const amount = ref(null);
const saving = ref(false);

async function save() {
  saving.value = true;
  try { await api('POST', '/api/notes/costs', { batch_id: props.batchId, date: date.value, description: description.value, amount: amount.value }); emit('toast', 'Biaya tersimpan.'); emit('saved'); }
  catch (e) { emit('toast', e.message); }
  finally { saving.value = false; }
}
</script>
