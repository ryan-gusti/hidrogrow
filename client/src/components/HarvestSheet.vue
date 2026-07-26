<template>
  <Sheet title="Catat Panen" sub="Panen bertahap didukung — batch tetap aktif sampai kamu menutupnya." @close="$emit('close')">
    <div class="field"><label>Batch</label>
      <select v-model="form.batch_id" class="input" required>
        <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.name }} — {{ b.plant_name }}</option>
      </select>
    </div>
    <div class="frow">
      <div class="field"><label>Jumlah (pcs/ikat)</label><input v-model.number="form.quantity" type="number" inputmode="numeric" min="1" placeholder="18" /></div>
      <div class="field"><label>Berat (gram)</label><input v-model.number="form.weight_grams" type="number" inputmode="numeric" min="1" placeholder="1450" /></div>
    </div>
    <div class="field"><label>Catatan kualitas (opsional)</label><input v-model="form.notes" type="text" placeholder="Daun utuh, akar putih bersih" /></div>
    <PhotoInput @uploaded="(url) => (form.photo = url)" @toast="(m) => emit('toast', m)" />
    <label class="field" style="display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--fg-2);margin-top:14px">
      <input v-model="closeBatch" type="checkbox" style="width:18px;height:18px;min-height:auto" /> Tutup batch ini (siklus selesai)
    </label>
    <div style="display:flex;gap:10px">
      <button class="btn btn-secondary" style="flex:1" @click="$emit('close')">Batal</button>
      <button class="btn btn-primary" style="flex:2" :disabled="saving" @click="save">{{ saving ? 'Menyimpan…' : 'Simpan panen' }}</button>
    </div>
  </Sheet>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import Sheet from './Sheet.vue';
import PhotoInput from './PhotoInput.vue';
import { api } from '../api';
import { todayStr, numID } from '../helpers';

const props = defineProps({ presetBatchId: { type: Number, default: null } });
const emit = defineEmits(['close', 'saved', 'toast']);

const batches = ref([]);
const saving = ref(false);
const closeBatch = ref(false);
const form = reactive({ batch_id: props.presetBatchId, date: todayStr(), quantity: null, weight_grams: null, notes: '', photo: null });

async function save() {
  if (!form.quantity || form.quantity < 1) { emit('toast', 'Isi jumlah panen.'); return; }
  if (!form.weight_grams || form.weight_grams < 1) { emit('toast', 'Isi berat panen dalam gram.'); return; }
  saving.value = true;
  try {
    await api('POST', '/api/harvests', { ...form });
    if (closeBatch.value) await api('POST', `/api/batches/${form.batch_id}/close`);
    emit('toast', `Panen ${numID(form.weight_grams)} g tercatat — masuk ke Laporan.`);
    emit('saved');
  } catch (err) { emit('toast', err.message); }
  finally { saving.value = false; }
}

onMounted(async () => {
  batches.value = await api('GET', '/api/batches?status=active');
  if (!form.batch_id && batches.value.length) form.batch_id = batches.value[0].id;
});
</script>
