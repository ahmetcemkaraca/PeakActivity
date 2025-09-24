<template>
  <div class="auth-container">
    <h2>Kaydol</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="email">E-posta:</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Şifre:</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Kaydolunuyor...' : 'Kaydol' }}
      </button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
    <p class="auth-switch">
      Zaten bir hesabınız var mı?
      <router-link to="/login">Giriş Yapın</router-link>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { AuthService } from '../auth/AuthService';
// import { useRouter } from 'vue-router'; // Vue 2'de useRouter kullanılmaz

export default defineComponent({
  name: 'Register',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      error: null as string | null,
    };
  },
  methods: {
    async handleRegister() {
      this.loading = true;
      this.error = null;
      try {
        const authService = new AuthService();
        await authService.register(this.email, this.password);
        this.$router.push('/'); // Başarılı kayıttan sonra ana sayfaya yönlendir
      } catch (err: any) {
        this.error = err.message || 'Kaydolurken bir hata oluştu.';
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  text-align: center;
}

.auth-container h2 {
  color: #333;
  margin-bottom: 25px;
  font-size: 2em;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.form-group input[type='email'],
.form-group input[type='password'] {
  width: calc(100% - 20px);
  padding: 12px 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s ease;
}

.form-group input[type='email']:focus,
.form-group input[type='password']:focus {
  border-color: #007bff;
  outline: none;
}

button {
  background-color: #007bff;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: bold;
  transition: background-color 0.3s ease;
  width: 100%;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-top: 15px;
  font-weight: bold;
}

.auth-switch {
  margin-top: 25px;
  color: #666;
}

.auth-switch router-link {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}

.auth-switch router-link:hover {
  text-decoration: underline;
}
</style>
