<template>
  <Sheet title="📝 Catatan Harian" @close="$emit('close')">
    <form class="space-y-3" @submit.prevent="save">
      <div>
        <label class="label">Tanggal</label>
        <input v-model="date" type="date" class="input" required />
      </div>
      <div>
        <label class="label">Catatan</label>
        <textarea v-model="text" class="input" rows="3" required placeholder="Progres tanaman, tanda hama, perubahan daun…"></textarea>
      </div>
      <PhotoInput @uploaded="(url) => (photo = url)" />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan Catatan' }}</button>
    </form>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import PhotoInput from './PhotoInput.vue';
import { api } from '../api';
import { todayStr } from '../helpers';

const props = defineProps({ batchId: { type: Number, required: true } });
const emit = defineEmits(['close', 'saved']);

const date = ref(todayStr());
const text = ref('');
const photo = ref(null);
const saving = ref(false);
const error = ref('');

async function save() {
  error.value = '';
  saving.value = true;
  try {
    await api('POST', '/api/notes', { batch_id: props.batchId, date: date.value, text: text.value, photo: photo.value });
    emit('saved');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>
