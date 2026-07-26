<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div style="text-align:center;margin-bottom:18px">
        <div class="logo" style="width:64px;height:64px;margin:0 auto 10px;color:var(--leaf)" v-html="ICON.leaf"></div>
        <h1 style="font-size:24px">Siapkan Kebunmu</h1>
        <p class="tag" style="color:var(--muted);font-size:14px">Buat instalasi hidroponik pertamamu untuk mulai.</p>
      </div>
      <InstallationForm @saved="onSaved" @toast="(m) => (msg = m)" />
      <p v-if="msg" class="auth-foot" style="color:var(--leaf-deep)">{{ msg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import InstallationForm from '../components/InstallationForm.vue';
import { ICON } from '../helpers';

const router = useRouter();
const auth = useAuthStore();
const msg = ref('');

async function onSaved() { await auth.fetchInstallations(true); router.push('/'); }
</script>
