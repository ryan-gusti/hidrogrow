<template>
  <div>
    <label v-if="label" class="label">{{ label }}</label>
    <div v-if="preview" class="relative">
      <img :src="preview" class="h-40 w-full rounded-xl object-cover" alt="Foto" />
      <button type="button" class="btn-danger absolute right-2 top-2 !min-h-0 px-2 py-1 text-xs" @click="clear">Hapus</button>
    </div>
    <label v-else class="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-leaf-400 hover:text-leaf-600">
      <span class="text-2xl">📷</span>
      {{ uploading ? 'Mengunggah…' : 'Tambah foto (opsional)' }}
      <input type="file" accept="image/*" capture="environment" class="hidden" :disabled="uploading" @change="onPick" />
    </label>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { uploadPhoto } from '../api';

const props = defineProps({ label: { type: String, default: '' } });
const emit = defineEmits(['uploaded']);

const preview = ref(null);
const uploading = ref(false);
const error = ref('');

async function onPick(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  error.value = '';
  uploading.value = true;
  try {
    preview.value = URL.createObjectURL(file);
    const url = await uploadPhoto(file);
    emit('uploaded', url);
  } catch (err) {
    error.value = err.message;
    preview.value = null;
  } finally {
    uploading.value = false;
    e.target.value = '';
  }
}

function clear() {
  preview.value = null;
  emit('uploaded', null);
}
</script>
