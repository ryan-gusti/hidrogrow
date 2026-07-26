import { defineStore } from 'pinia';
import { api, getToken, setToken } from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    installations: [],
    installationsLoaded: false,
  }),
  getters: {
    isLoggedIn: (s) => !!getToken() && !!s.user,
    needsOnboarding: (s) => s.installationsLoaded && s.installations.length === 0,
  },
  actions: {
    async fetchMe() {
      if (!getToken()) return null;
      try {
        const { user } = await api('GET', '/api/auth/me');
        this.user = user;
      } catch {
        // Token basi/tidak valid (misal DB direset) — bersihkan agar tidak redirect loop
        setToken(null);
        this.user = null;
        this.installations = [];
        this.installationsLoaded = false;
      }
      return this.user;
    },
    async fetchInstallations(force = false) {
      if (this.installationsLoaded && !force) return this.installations;
      this.installations = await api('GET', '/api/installations');
      this.installationsLoaded = true;
      return this.installations;
    },
    async login(username, password) {
      const data = await api('POST', '/api/auth/login', { username, password });
      setToken(data.token);
      this.user = data.user;
      this.installationsLoaded = false;
    },
    logout() {
      setToken(null);
      this.user = null;
      this.installations = [];
      this.installationsLoaded = false;
    },
  },
});
