<template>
  <div class="auth-wrap">
    <div class="auth-card card" style="padding:28px 24px">
      <div class="logo" v-html="ICON.leaf"></div>
      <h1>HidroGrow</h1>
      <p class="tag">Buku catatan kebun hidroponikmu 🌱</p>
      <form @submit.prevent="submit">
        <div class="field"><label>Username</label><input v-model="username" type="text" required autocomplete="username" autocapitalize="none" placeholder="admin" /></div>
        <div class="field"><label>Password</label><input v-model="password" type="password" required autocomplete="current-password" placeholder="••••••••" /></div>
        <button class="btn btn-primary" style="width:100%" :disabled="loading">{{ loading ? 'Memproses…' : 'Masuk' }}</button>
      </form>
      <p class="auth-foot">Akun default: <b>admin</b> / <b>admin123</b> — segera ganti password di Pengaturan.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ICON } from '../helpers';

const router = useRouter();
const auth = useAuthStore();
const username = ref('');
const password = ref('');
const loading = ref(false);

async function submit() {
  loading.value = true;
  try { await auth.login(username.value, password.value); router.push('/'); }
  catch (e) { alert(e.message); }
  finally { loading.value = false; }
}
</script>
