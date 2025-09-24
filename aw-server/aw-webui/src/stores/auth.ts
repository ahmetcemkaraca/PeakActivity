import { defineStore } from 'pinia';
import { AuthService } from '../auth/AuthService';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null,
  }),

  actions: {
    initAuthService() {
      const authService = new AuthService();
      authService.onAuthChange(user => {
        this.user = user;
        this.loading = false;
      });
    },

    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const authService = new AuthService();
        await authService.login(email, password);
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const authService = new AuthService();
        await authService.register(email, password);
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      this.error = null;
      try {
        const authService = new AuthService();
        await authService.logout();
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
