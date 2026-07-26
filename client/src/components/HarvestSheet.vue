<template>
  <Sheet title="🧺 Catat Panen" @close="$emit('close')">
    <form class="space-y-3" @submit.prevent="save">
      <div>
        <label class="label">Batch</label>
        <select v-model="form.batch_id" class="input" required>
          <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.name }} ({{ b.plant_name }})</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Tanggal panen</label>
          <input v-model="form.date" type="date" class="input" required />
        </div>
        <div>
          <label class="label">Jumlah</label>
          <div class="flex gap-1">
            <input v-model.number="form.quantity" type="number" step="1" min="0" class="input" placeholder="18" inputmode="numeric" />
            <select v-model="form.unit" class="input !w-24">
              <option value="pcs">pcs</option>
              <option value="ikat">ikat</option>
              <option value="pack">pack</option>
              <option value="buah">buah</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <label class="label">Berat (gram)</label>
        <input v-model.number="form.weight_grams" type="number" step="1" min="0" class="input" placeholder="1450" inputmode="numeric" />
      </div>
      <div>
        <label class="label">Catatan kualitas (opsional)</label>
        <textarea v-model="form.notes" class="input" rows="2" placeholder="Daun segar, ukuran seragam…"></textarea>
      </div>
      <PhotoInput @uploaded="(url) => (form.photo = url)" />
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input v-model="closeBatch" type="checkbox" class="h-5 w-5 rounded border-gray-300 text-leaf-600" />
        Tutup batch ini (siklus selesai)
      </label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan Panen' }}</button>
    </form>
  </Sheet>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import Sheet from './Sheet.vue';
import PhotoInput from './PhotoInput.vue';
import { api } from '../api';
import { todayStr } from '../helpers';

const props = defineProps({ presetBatchId: { type: Number, default: null } });
const emit = defineEmits(['close', 'saved']);

const batches = ref([]);
const saving = ref(false);
const error = ref('');
const closeBatch = ref(false);

const form = reactive({
  batch_id: props.presetBatchId,
  date: todayStr(),
  quantity: null,
  unit: 'pcs',
  weight_grams: null,
  notes: '',
  photo: null,
});

async function save() {
  error.value = '';
  saving.value = true;
  try {
    await api('POST', '/api/harvests', { ...form });
    if (closeBatch.value) await api('POST', `/api/batches/${form.batch_id}/close`);
    emit('saved');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  batches.value = await api('GET', '/api/batches?status=active');
  if (!form.batch_id && batches.value.length) form.batch_id = batches.value[0].id;
});
</script>
