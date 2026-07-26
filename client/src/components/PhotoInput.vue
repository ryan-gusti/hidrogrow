<template>
  <div>
    <label v-if="label" class="field" style="margin:0 0 6px"><span style="font-size:12px;font-weight:500;color:var(--muted)">{{ label }}</span></label>
    <div v-if="preview" style="position:relative;margin-bottom:14px">
      <img :src="preview" class="batch-thumb" style="width:100%;height:140px;cursor:zoom-in" alt="Foto" @click="openLightbox(preview, 'Foto')" />
      <button class="btn btn-danger btn-sm" style="position:absolute;right:8px;top:8px" @click="clear">Hapus</button>
    </div>
    <label v-else class="field" style="margin:0;display:block">
      <span style="display:flex;height:88px;width:100%;cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:1.5px dashed var(--border-soft);border-radius:var(--radius-md);font-size:13px;color:var(--meta)">
        <span style="font-size:24px">📷</span>{{ uploading ? 'Mengunggah…' : 'Tambah foto (opsional)' }}
        <input type="file" accept="image/*" capture="environment" style="display:none" :disabled="uploading" @change="onPick" />
      </span>
    </label>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { uploadPhoto } from '../api';
import { openLightbox } from '../helpers';

const props = defineProps({ label: { type: String, default: '' } });
const emit = defineEmits(['uploaded', 'toast']);

const preview = ref(null);
const uploading = ref(false);

async function onPick(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    preview.value = URL.createObjectURL(file);
    const url = await uploadPhoto(file);
    emit('uploaded', url);
  } catch (err) { emit('toast', err.message); preview.value = null; }
  finally { uploading.value = false; e.target.value = ''; }
}
function clear() { preview.value = null; emit('uploaded', null); }
</script>
