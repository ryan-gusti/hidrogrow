<template>
  <div v-if="batch">
    <button class="btn btn-ghost btn-sm" style="margin-bottom:10px" @click="$router.back()">← Kembali</button>

    <div class="card" style="padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px">
        <div>
          <h1 style="font-size:24px">{{ batch.name }}</h1>
          <p style="color:var(--muted);font-size:13.5px">{{ batch.plant_name }} · {{ batch.quantity }} tanaman · Hari ke-{{ batch.day_number }}</p>
        </div>
        <span class="badge" :class="statusChip">{{ statusLabel }}</span>
      </div>
      <PhaseBar :batch="batch" style="margin-top:14px" />

      <div style="margin-top:14px">
        <div class="eyebrow" style="margin-bottom:8px">Timeline fase</div>
        <div v-for="(p, i) in batch.timeline.phases" :key="i" style="display:flex;align-items:center;gap:10px;font-size:13.5px;margin-bottom:4px">
          <span style="width:10px;height:10px;border-radius:50%" :style="{ background: isCurrent(p) ? 'var(--leaf)' : todayStr() >= p.end ? 'var(--silver)' : 'var(--border-soft)' }"></span>
          <span style="width:110px;font-weight:500" :style="{ color: isCurrent(p) ? 'var(--fg)' : 'var(--muted)' }">{{ p.name }}</span>
          <span style="font-size:12px;color:var(--meta)">{{ formatShort(p.start) }} – {{ formatShort(p.end) }} ({{ p.days }} hari)</span>
          <span v-if="isCurrent(p)" class="badge b-ok" style="margin-left:auto">saat ini</span>
        </div>
      </div>

      <div class="stat-grid" style="margin-top:16px;margin-bottom:0">
        <div class="stat"><div class="v">{{ numID(totalHarvest) }} <small>g</small></div><div class="k">Total panen</div></div>
        <div class="stat"><div class="v">{{ batch.harvests.length }}x</div><div class="k">Panen</div></div>
        <div class="stat"><div class="v">{{ rupiah(totalCost) }}</div><div class="k">Biaya</div></div>
        <div class="stat"><div class="v">{{ batch.tasks.length }}</div><div class="k">Jadwal</div></div>
      </div>
    </div>

    <div v-if="batch.status === 'active'" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      <button class="btn btn-secondary btn-sm" @click="harvestSheet = true">🧺 Catat panen</button>
      <button class="btn btn-secondary btn-sm" @click="noteSheet = true">📝 Catatan</button>
      <button class="btn btn-secondary btn-sm" @click="costSheet = true">💰 Tambah biaya</button>
      <button class="btn btn-danger btn-sm" @click="failSheet = true">✖ Tandai gagal</button>
    </div>

    <section v-if="batch.tasks.length" class="sec" style="margin-top:0">
      <div class="sec-head"><h2 style="font-size:19px">Jadwal berikutnya</h2></div>
      <div class="card" style="padding:0 16px">
        <div v-for="t in batch.tasks" :key="t.id" class="ev-row">
          <span class="bar" :style="{ background: (EVENT_META[t.type] || EVENT_META.lainnya).col }"></span>
          <div class="b"><div class="t">{{ t.title }}</div><div class="m">{{ formatShort(t.due_date) }}<template v-if="t.recurrence_days"> · tiap {{ t.recurrence_days }} hari</template></div></div>
        </div>
      </div>
    </section>

    <section v-if="batch.harvests.length" class="sec">
      <div class="sec-head"><h2 style="font-size:19px">Riwayat panen</h2></div>
      <div class="card" style="padding:0 16px">
        <div v-for="h in batch.harvests" :key="h.id" class="hist-row">
          <img v-if="h.photo" :src="h.photo" style="width:48px;height:48px;border-radius:8px;object-fit:cover" alt="Foto panen" />
          <div class="b"><div class="t">{{ formatId(h.date) }}</div><div class="m">{{ h.quantity }} {{ h.unit }}<template v-if="h.weight_grams"> · {{ numID(h.weight_grams) }} g</template><template v-if="h.notes"> · {{ h.notes }}</template></div></div>
          <span class="g">{{ numID(h.weight_grams || 0) }} g</span>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="sec-head"><h2 style="font-size:19px">Catatan harian</h2><span class="sp"></span><button class="btn btn-ghost btn-sm" @click="noteSheet = true">+ Tambah</button></div>
      <div v-if="batch.notes.length === 0" class="empty-note">Belum ada catatan.</div>
      <div v-else class="card" style="padding:0 16px">
        <div v-for="n in batch.notes" :key="n.id" class="note">
          <span class="dt">{{ formatShort(n.date) }}</span>
          <span class="tx">
            <img v-if="n.photo" :src="n.photo" style="width:40px;height:40px;border-radius:8px;object-fit:cover;float:right;margin-left:8px" alt="Foto catatan" />
            {{ n.text }}
          </span>
        </div>
      </div>
    </section>

    <HarvestSheet v-if="harvestSheet" :preset-batch-id="batch.id" @close="harvestSheet = false" @saved="onSaved" @toast="onToast" />
    <NoteSheet v-if="noteSheet" :batch-id="batch.id" @close="noteSheet = false" @saved="onSaved" @toast="onToast" />
    <CostSheet v-if="costSheet" :batch-id="batch.id" @close="costSheet = false" @saved="onSaved" @toast="onToast" />
    <Sheet v-if="failSheet" title="Tandai Batch Gagal" @close="failSheet = false">
      <p class="sub">Catat alasan kegagalan untuk pembelajaran siklus berikutnya.</p>
      <div class="field"><label>Alasan</label>
        <select v-model="failReason" class="input"><option>Busuk akar</option><option>Hama (kutu daun / ulat)</option><option>Gagal semai</option><option>Larutan tidak stabil</option><option>Lainnya</option></select>
      </div>
      <div class="field"><label>Catatan pembelajaran</label><input v-model="failNote" type="text" placeholder="Apa yang akan dilakukan berbeda?" /></div>
      <button class="btn btn-danger" style="width:100%" :disabled="savingFail" @click="markFailed">{{ savingFail ? 'Menyimpan…' : 'Tandai gagal & tutup batch' }}</button>
    </Sheet>
  </div>
  <div v-else class="empty-note">Memuat…</div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import { EVENT_META, formatId, formatShort, todayStr, numID, rupiah } from '../helpers';
import PhaseBar from '../components/PhaseBar.vue';
import HarvestSheet from '../components/HarvestSheet.vue';
import NoteSheet from '../components/NoteSheet.vue';
import CostSheet from '../components/CostSheet.vue';
import Sheet from '../components/Sheet.vue';

const route = useRoute();
const batch = ref(null);
const harvestSheet = ref(false);
const noteSheet = ref(false);
const costSheet = ref(false);
const failSheet = ref(false);
const failReason = ref('Busur akar');
const failNote = ref('');
const savingFail = ref(false);

const statusLabel = computed(() => batch.value.status === 'active' ? batch.value.current_phase : batch.value.status === 'done' ? 'Selesai' : 'Gagal');
const statusChip = computed(() => batch.value.status === 'active' ? 'b-ok' : batch.value.status === 'done' ? 'b-muted' : 'b-bad');
const totalHarvest = computed(() => batch.value.harvests.reduce((s, h) => s + (h.weight_grams || 0), 0));
const totalCost = computed(() => batch.value.costs.reduce((s, c) => s + c.amount, 0));
const isCurrent = (p) => batch.value.status === 'active' && todayStr() >= p.start && todayStr() < p.end;

async function load() { try { batch.value = await api('GET', `/api/batches/${route.params.id}`); } catch { /* offline */ } }
function onSaved() { harvestSheet.value = noteSheet.value = costSheet.value = false; load(); window.dispatchEvent(new CustomEvent('hg:refresh')); }
function onToast(m) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: m })); }

async function markFailed() {
  savingFail.value = true;
  try { await api('POST', `/api/batches/${batch.value.id}/fail`, { reason: failNote.value || failReason.value }); failSheet.value = false; load(); window.dispatchEvent(new CustomEvent('hg:refresh')); }
  catch (e) { window.dispatchEvent(new CustomEvent('hg:toast', { detail: e.message })); }
  finally { savingFail.value = false; }
}

onMounted(() => { load(); window.addEventListener('hg:refresh', load); });
onUnmounted(() => window.removeEventListener('hg:refresh', load));
</script>
