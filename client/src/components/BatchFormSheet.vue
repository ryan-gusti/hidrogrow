<template>
  <Sheet title="🌱 Batch Tanam Baru" @close="$emit('close')">
    <form class="space-y-3" @submit.prevent="save">
      <div>
        <label class="label">Tanaman</label>
        <select v-model="form.plant_template_id" class="input" required>
          <option v-for="p in plants" :key="p.id" :value="p.id">{{ p.name }}{{ p.is_custom ? ' (kustom)' : '' }}</option>
        </select>
        <p v-if="selectedPlant?.tips" class="mt-1 text-xs text-gray-500">💡 {{ selectedPlant.tips }}</p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Tanggal semai</label>
          <input v-model="form.sow_date" type="date" class="input" required />
        </div>
        <div>
          <label class="label">Jumlah bibit</label>
          <input v-model.number="form.quantity" type="number" min="1" class="input" required inputmode="numeric" />
        </div>
      </div>
      <div>
        <label class="label">Instalasi tujuan</label>
        <select v-model="form.installation_id" class="input" required>
          <option v-for="i in installations" :key="i.id" :value="i.id">{{ i.name }}</option>
        </select>
      </div>

      <details class="rounded-xl border border-gray-200 p-3">
        <summary class="cursor-pointer text-sm font-medium text-gray-700">Sesuaikan durasi & interval (opsional)</summary>
        <div class="mt-3 space-y-3">
          <div v-if="selectedPlant">
            <p class="mb-1 text-xs font-medium text-gray-500">Durasi tiap fase (hari)</p>
            <div class="flex gap-2">
              <div v-for="(p, i) in selectedPlant.phases" :key="i" class="flex-1">
                <label class="block text-xs text-gray-500">{{ p.name }}</label>
                <input v-model.number="overrides[i]" type="number" min="1" class="input !px-2 text-center" inputmode="numeric" />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500">Cek nutrisi tiap (hari)</label>
              <input v-model.number="form.check_interval" type="number" min="1" class="input" inputmode="numeric" />
            </div>
            <div>
              <label class="block text-xs text-gray-500">Ganti larutan tiap (hari)</label>
              <input v-model.number="form.replace_interval" type="number" min="1" class="input" inputmode="numeric" />
            </div>
          </div>
        </div>
      </details>

      <div v-if="preview" class="rounded-xl bg-leaf-50 p-3 text-sm text-leaf-800">
        📅 Pindah tanam ≈ <b>{{ preview.transplant }}</b> · Estimasi panen ≈ <b>{{ preview.harvest }}</b>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Buat Batch + Reminder Otomatis' }}</button>
    </form>
  </Sheet>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Sheet from './Sheet.vue';
import { api } from '../api';
import { todayStr, addDays, formatShort } from '../helpers';

const props = defineProps({
  presetDate: { type: String, default: null },
});
const emit = defineEmits(['close', 'saved']);

const plants = ref([]);
const installations = ref([]);
const saving = ref(false);
const error = ref('');
const overrides = ref([]);

const form = reactive({
  plant_template_id: null,
  sow_date: props.presetDate || todayStr(),
  quantity: 10,
  installation_id: null,
  check_interval: 2,
  replace_interval: 14,
});

const selectedPlant = computed(() => plants.value.find((p) => p.id === form.plant_template_id));

watch(selectedPlant, (p) => {
  overrides.value = p ? p.phases.map((x) => x.days) : [];
});

const preview = computed(() => {
  const p = selectedPlant.value;
  if (!p || !form.sow_date || overrides.value.length !== p.phases.length) return null;
  const total = (n) => overrides.value.slice(0, n).reduce((s, x) => s + (x || 0), 0);
  return {
    transplant: formatShort(addDays(form.sow_date, total(1))),
    harvest: formatShort(addDays(form.sow_date, total(p.phases.length - 1))),
  };
});

async function save() {
  error.value = '';
  saving.value = true;
  try {
    const defaultDays = selectedPlant.value.phases.map((x) => x.days);
    const custom = overrides.value.some((v, i) => v !== defaultDays[i]);
    await api('POST', '/api/batches', { ...form, phase_overrides: custom ? overrides.value : null });
    emit('saved');
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  const [p, i] = await Promise.all([api('GET', '/api/plants'), api('GET', '/api/installations')]);
  plants.value = p;
  installations.value = i;
  if (p.length) form.plant_template_id = p[0].id;
  if (i.length) form.installation_id = i[0].id;
});
</script>
