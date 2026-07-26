<template>
  <div class="flex min-h-dvh items-center justify-center bg-gradient-to-b from-leaf-50 to-white px-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <img src="/icon.svg" alt="HidroGrow" class="mx-auto mb-3 h-20 w-20" />
        <h1 class="text-2xl font-bold text-leaf-700">HidroGrow</h1>
        <p class="text-sm text-gray-500">Buku catatan kebun hidroponikmu 🌱</p>
      </div>

      <div class="card">
        <form class="space-y-3" @submit.prevent="submit">
          <div>
            <label class="label">Username</label>
            <input v-model="username" type="text" class="input" required autocomplete="username" autocapitalize="none" placeholder="admin" />
          </div>
          <div>
            <label class="label">Password</label>
            <input v-model="password" type="password" class="input" required autocomplete="current-password" placeholder="••••••••" />
          </div>
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
          <button class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Memproses…' : 'Masuk' }}
          </button>
        </form>
      </div>
      <p class="mt-4 text-center text-xs text-gray-400">
        Akun default: <b>admin</b> / <b>admin123</b> — segera ganti password di Pengaturan.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(username.value, password.value);
    router.push('/');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
