<template>
  <Sheet :title="`Tambah Jadwal — ${formatShort(date)}`" @close="$emit('close')">
    <!-- Langkah 1: pilih jenis event -->
    <div v-if="!type" class="grid grid-cols-2 gap-2">
      <button v-for="t in eventTypes" :key="t.value" class="card flex flex-col items-center gap-1 !p-4 hover:!border-leaf-300"
        @click="pick(t.value)">
        <span class="text-2xl">{{ t.icon }}</span>
        <span class="text-sm font-medium">{{ t.label }}</span>
      </button>
    </div>

    <!-- Langkah 2: form task -->
    <form v-else class="space-y-3" @submit.prevent="save">
      <button type="button" class="text-sm text-leaf-600" @click="type = null">← Ganti jenis</button>
      <div>
        <label class="label">Judul</label>
        <input v-model="title" type="text" class="input" required />
      </div>
      <div>
        <label class="label">Instalasi (opsional)</label>
        <select v-model="installationId" class="input">
          <option :value="null">—</option>
          <option v-for="i in installations" :key="i.id" :value="i.id">{{ i.name }}</option>
        </select>
      </div>
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input v-model="recurring" type="checkbox" class="h-5 w-5 rounded border-gray-300 text-leaf-600" />
        Berulang
      </label>
      <div v-if="recurring">
        <label class="label">Ulangi tiap (hari)</label>
        <input v-model.number="interval" type="number" min="1" class="input" inputmode="numeric" />
      </div>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan Jadwal' }}</button>
    </form>
  </Sheet>
</template>

<script setup>
import { ref } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { formatShort } from '../helpers';

const props = defineProps({
  date: { type: String, required: true },
  installations: { type: Array, default: () => [] },
});
const emit = defineEmits(['close', 'saved', 'new-batch']);

const eventTypes = [
  { value: 'semai', label: 'Mulai Semai', icon: '🌱' },
  { value: 'pindah', label: 'Pindah Tanam', icon: '🪴' },
  { value: 'cek_nutrisi', label: 'Cek Nutrisi', icon: '💧' },
  { value: 'ganti_larutan', label: 'Ganti Larutan', icon: '🔄' },
  { value: 'bersih_tandon', label: 'Bersihkan Tandon', icon: '🧽' },
  { value: 'lainnya', label: 'Lainnya', icon: '📝' },
];

const type = ref(null);
const title = ref('');
const installationId = ref(null);
const recurring = ref(false);
const interval = ref(2);
const saving = ref(false);
const error = ref('');

function pick(t) {
  if (t === 'semai') {
    emit('new-batch'); // Mulai Semai → buat batch baru (F-C.4)
    return;
  }
  type.value = t;
  const meta = eventTypes.find((x) => x.value === t);
  title.value = meta.label;
  recurring.value = t === 'cek_nutrisi';
}

async function save() {
  error.value = '';
  saving.value = true;
  try {
    await api('POST', '/api/tasks', {
      type: type.value,
      title: title.value,
      due_date: props.date,
      installation_id: installationId.value,
      recurrence_days: recurring.value ? interval.value : null,
    });
    emit('saved');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}
</script>
