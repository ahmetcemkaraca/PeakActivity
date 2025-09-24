<template>
  <div id="app">
    <a href="#main-content" class="visually-hidden skip-link">Ana içeriğe atla</a>
    <Header />
    <main id="main-content">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from 'vue';
import Header from './components/Header.vue';
import { AuthService } from './auth/AuthService';
// import { useRouter } from 'vue-router'; // Vue 2'de useRouter kullanılmaz

export default defineComponent({
  name: 'App',
  components: {
    Header,
  },
  data() {
    return {
      unsubscribeAuth: null as (() => void) | null,
    };
  },
  watch: {
    '$route': {
      immediate: true,
      handler(to) {
        document.title = to.meta.title ? `${to.meta.title} - ActivityWatch` : 'ActivityWatch';
        // Odak yönetimi için atlama bağlantısına odaklan
        this.$nextTick(() => {
          const skipLink = document.querySelector('.skip-link') as HTMLElement;
          if (skipLink) {
            skipLink.focus();
          }
        });
      },
    },
  },
  created() {
    const authService = new AuthService();

    const handleAuthChange = (user: any) => {
      // Vue 2'de router'a this.$router üzerinden erişilir
      if (!user && this.$router.currentRoute.meta.requiresAuth) {
        this.$router.push('/login');
      } else if (user && (this.$router.currentRoute.path === '/login' || this.$router.currentRoute.path === '/register')) {
        this.$router.push('/'); // Kullanıcı giriş yapmışsa ve giriş/kayıt sayfasındaysa ana sayfaya yönlendir
      }
    };

    this.unsubscribeAuth = authService.onAuthChange(handleAuthChange);
  },
  beforeDestroy() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  },
});
</script>

<style>
/* Global stilles for the app */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

main {
  padding: 20px;
}

.visually-hidden {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.visually-hidden:focus {
  position: static;
  width: auto;
  height: auto;
  left: auto;
  top: auto;
}
</style>
