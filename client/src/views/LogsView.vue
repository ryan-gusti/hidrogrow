<template>
  <div>
    <div class="page-head">
      <h1>Log Nutrisi</h1>
      <span class="sp"></span>
      <button class="btn btn-primary" @click="logSheet = true"><span v-html="ICON.plus"></span>Catat Log</button>
    </div>

    <div class="chips">
      <button class="chip" :class="{ on: curInst === null }" @click="setInst(null)">Semua instalasi</button>
      <button v-for="i in installations" :key="i.id" class="chip" :class="{ on: curInst === i.id }" @click="setInst(i.id)">{{ i.name }}</button>
    </div>

    <div class="log-cols">
      <div>
        <section v-if="curInst !== null" class="reading">
          <div class="card read"><div class="k">pH terakhir</div><div class="v">{{ last ? comma(last.ph) : '—' }}</div><span v-if="last" class="badge" :class="phBadge"><span class="dot"></span>{{ phBadge === 'b-ok' ? 'Dalam rentang' : phBadge === 'b-warn' ? 'Perlu penyesuaian' : 'Di luar rentang' }}</span></div>
          <div class="card read"><div class="k">PPM terakhir</div><div class="v">{{ last ? numID(last.ppm) : '—' }}</div><span v-if="last" class="badge" :class="ppmBadge"><span class="dot"></span>{{ ppmBadge === 'b-ok' ? 'Dalam rentang' : 'Perlu penyesuaian' }}</span></div>
          <div class="card read"><div class="k">Suhu air</div><div class="v">{{ last && last.water_temp != null ? comma(last.water_temp) + '°' : '—' }}</div><span v-if="last" class="badge b-muted">{{ formatShort(last.date) }}</span></div>
        </section>

        <section v-if="curInst !== null" class="sec card chart-card">
          <div class="chart-head">
            <h2 style="font-size:19px">Tren 14 hari</h2><span class="sp"></span>
            <div class="seg">
              <button :class="{ on: kind === 'ph' }" @click="kind = 'ph'">pH</button>
              <button :class="{ on: kind === 'ppm' }" @click="kind = 'ppm'">PPM</button>
            </div>
          </div>
          <TrendChart v-if="trend.length" :logs="trend" :kind="kind" />
          <div v-else class="empty-note" style="padding:20px;text-align:center">Belum ada data untuk instalasi ini.</div>
        </section>

        <section class="sec">
          <div class="sec-head"><h2>Riwayat</h2><span class="badge b-muted">{{ logs.length }} entri</span><span class="sp"></span></div>
          <div class="card" style="padding:0">
            <div v-for="l in logs" :key="l.id" class="log-row">
              <span class="st" :style="{ background: flagColor(l) }"></span>
              <img v-if="l.photo" :src="l.photo" style="width:40px;height:40px;border-radius:8px;object-fit:cover;flex:none;cursor:zoom-in" alt="Foto log" @click="openLightbox(l.photo, 'Foto log')" />
              <span class="dt">{{ formatShort(l.date) }}</span>
              <div class="bd">
                <div class="t">{{ typeLabel(l.type) }}<span v-if="curInst === null" style="color:var(--meta);font-weight:400"> · {{ instName(l.installation_id) }}</span></div>
                <div class="m">pH {{ comma(l.ph) }}<template v-if="l.ppm != null"> · {{ numID(l.ppm) }} PPM</template><template v-if="l.water_temp != null"> · {{ comma(l.water_temp) }}°C</template><template v-if="l.volume_added != null"> · +{{ comma(l.volume_added) }} L</template></div>
              </div>
              <span class="badge b-muted">{{ typeLabel(l.type).split(' ')[0] }}</span>
            </div>
            <div v-if="!logs.length" class="empty-note" style="padding:20px;text-align:center">Belum ada log.</div>
          </div>
        </section>
      </div>
    </div>

    <QuickLogSheet v-if="logSheet" :preset-installation-id="curInst" @close="logSheet = false" @saved="onSaved" @toast="onToast" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '../api';
import { ICON, comma, numID, formatShort, openLightbox } from '../helpers';
import TrendChart from '../components/TrendChart.vue';
import QuickLogSheet from '../components/QuickLogSheet.vue';

const installations = ref([]);
const logs = ref([]);
const trend = ref([]);
const curInst = ref(null);
const kind = ref('ph');
const logSheet = ref(false);

const last = computed(() => logs.value[0]);

const phBadge = computed(() => badgeOf(last.value?.ph, 5.5, 6.5));
const ppmBadge = computed(() => badgeOf(last.value?.ppm, 840, 1400));
function badgeOf(v, lo, hi) { if (v == null) return 'b-muted'; if (v >= lo && v <= hi) return 'b-ok'; if (v >= lo * 0.94 && v <= hi * 1.06) return 'b-warn'; return 'b-bad'; }
function flagColor(l) { const p = badgeOf(l.ph, l.range?.ph_min || 5.5, l.range?.ph_max || 6.5); const m = badgeOf(l.ppm, l.range?.ppm_min || 840, l.range?.ppm_max || 1400); if (p === 'b-bad' || m === 'b-bad') return 'var(--danger)'; if (p === 'b-warn' || m === 'b-warn') return 'var(--warn)'; return 'var(--leaf)'; }
const typeLabel = (t) => ({ cek: 'Cek rutin', topup: 'Top-up air', kuras: 'Kuras total' }[t] || t);
const instName = (id) => installations.value.find((i) => i.id === id)?.name || '—';

function setInst(id) { curInst.value = id; load(); }

async function load() {
  try {
    if (curInst.value === null) {
      logs.value = await api('GET', '/api/logs');
      trend.value = [];
    } else {
      [logs.value, trend.value] = await Promise.all([
        api('GET', `/api/logs?installation_id=${curInst.value}`),
        api('GET', `/api/logs/trend?installation_id=${curInst.value}`),
      ]);
    }
  } catch { /* offline */ }
}
function onSaved() { logSheet.value = false; load(); window.dispatchEvent(new CustomEvent('hg:refresh')); }
function onToast(m) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: m })); }

onMounted(async () => {
  installations.value = await api('GET', '/api/installations').catch(() => []);
  load();
  window.addEventListener('hg:refresh', load);
});
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
