<template>
  <Sheet title="Catatan Harian" @close="$emit('close')">
    <form @submit.prevent="save">
      <div class="field"><label>Tanggal</label><input v-model="date" type="date" required /></div>
      <div class="field"><label>Catatan</label><textarea v-model="text" rows="3" required placeholder="Progres tanaman, tanda hama, perubahan daun…"></textarea></div>
      <PhotoInput @uploaded="(url) => (photo = url)" @toast="(m) => emit('toast', m)" />
      <div style="display:flex;gap:10px;margin-top:14px">
        <button type="button" class="btn btn-secondary" style="flex:1" @click="$emit('close')">Batal</button>
        <button type="submit" class="btn btn-primary" style="flex:2" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
      </div>
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
const emit = defineEmits(['close', 'saved', 'toast']);
const date = ref(todayStr());
const text = ref('');
const photo = ref(null);
const saving = ref(false);

async function save() {
  saving.value = true;
  try { await api('POST', '/api/notes', { batch_id: props.batchId, date: date.value, text: text.value, photo: photo.value }); emit('toast', 'Catatan tersimpan.'); emit('saved'); }
  catch (e) { emit('toast', e.message); }
  finally { saving.value = false; }
}
</script>
