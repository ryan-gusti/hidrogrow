<template>
  <div class="task" :class="{ overdue: overdue }">
    <button class="t-check" :aria-label="task.status === 'done' ? 'Batalkan selesai' : 'Tandai selesai'" @click="$emit('complete')"><span v-html="ICON.check"></span></button>
    <div class="t-body">
      <div class="t-title">{{ task.title }} <span class="badge" :class="meta.cls"><span class="dot"></span>{{ meta.label }}</span></div>
      <div class="t-meta">
        <span v-if="task.installation_id">{{ instName }}</span><span v-if="task.recurrence_days"> · tiap {{ task.recurrence_days }} hari</span>
        · <span v-if="overdue" class="overdue-tag">Terlambat {{ overdueDays }} hari</span><span v-else>Hari ini</span>
      </div>
    </div>
    <div class="t-act">
      <button v-if="task.type === 'cek_nutrisi' || task.type === 'ganti_larutan'" class="t-fill" @click="$emit('log')"><span v-html="ICON.drop"></span>Isi log</button>
      <button class="icon-btn" @click="$emit('snooze')" aria-label="Tunda"><span v-html="ICON.clock"></span></button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { EVENT_META, ICON, todayStr, parseDate } from '../helpers';
import { useAuthStore } from '../stores/auth';

const props = defineProps({ task: { type: Object, required: true } });
defineEmits(['complete', 'log', 'snooze']);

const auth = useAuthStore();
const meta = computed(() => EVENT_META[props.task.type] || EVENT_META.lainnya);
const instName = computed(() => auth.installations.find((i) => i.id === props.task.installation_id)?.name || '');
const overdue = computed(() => props.task.due_date < todayStr());
const overdueDays = computed(() => Math.round((parseDate(todayStr()) - parseDate(props.task.due_date)) / 86400000));
</script>
