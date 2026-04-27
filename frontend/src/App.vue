<template>
  <div class="app-layout">
    <!-- 导航栏 -->
    <nav class="navbar" :class="{ scrolled: isScrolled }">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo">
          <span class="logo-icon">◆</span>
          <span class="logo-text">JT-Hub</span>
        </router-link>

        <div class="nav-center">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/activity" class="nav-link">活动公告</router-link>
          <router-link v-if="store.isLoggedIn" to="/submit" class="nav-link">提交需求</router-link>
          <router-link v-if="store.isLoggedIn" to="/my-orders" class="nav-link">我的订单</router-link>
        </div>

        <div class="nav-right">
          <template v-if="!store.isLoggedIn">
            <button class="btn-login" @click="showLoginModal = true">登 录</button>
          </template>
          <template v-else>
            <router-link to="/my-orders" class="nav-user-btn">
              <span class="user-dot"></span>已登录
            </router-link>
            <button class="btn-logout" @click="handleLogout">退出</button>
          </template>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <span class="footer-logo">◆ JT-Hub</span>
        <span class="footer-sep">·</span>
        <span>管理员微信：<strong>Jt--04</strong></span>
      </div>
    </footer>

    <!-- 登录弹窗 -->
    <Transition name="modal">
      <div v-if="showLoginModal" class="modal-overlay" @click.self="showLoginModal = false">
        <div class="modal-card">
          <button class="modal-close" @click="showLoginModal = false">✕</button>
          <div class="modal-logo">◆</div>
          <h2 class="modal-title">登录 JT-Hub</h2>
          <p class="modal-desc">输入您的微信号，提交需求后管理员会主动联系您</p>
          <div class="modal-field">
            <label>微信号</label>
            <input
              v-model="pcWechat"
              class="modal-input"
              placeholder="请输入您的微信号"
              @keyup.enter="doLogin"
              autofocus
            />
          </div>
          <button class="modal-btn" @click="doLogin" :disabled="logging">
            <span v-if="!logging">确认登录</span>
            <span v-else class="btn-loading">登录中...</span>
          </button>
          <p class="modal-hint">仅用于提交需求时关联您的订单</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './store/user'
import { api } from './api'

const store = useUserStore()
const router = useRouter()
const showLoginModal = ref(false)
const pcWechat = ref('')
const logging = ref(false)
const isScrolled = ref(false)

function onScroll() { isScrolled.value = window.scrollY > 10 }
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

// 暴露给子页面调用
defineExpose({ openLogin: () => { showLoginModal.value = true } })

async function doLogin() {
  if (!pcWechat.value.trim()) return
  logging.value = true
  try {
    const res: any = await api.mpLogin(`pc_${pcWechat.value.trim()}`)
    store.setAuth(res.data.token, res.data.userId)
    showLoginModal.value = false
    pcWechat.value = ''
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (redirect) router.push(redirect)
  } catch {
    alert('登录失败，请稍后重试')
  } finally {
    logging.value = false
  }
}

function handleLogout() {
  store.logout()
  router.push('/')
}
</script>

<style>
/* ─── 布局 ─── */
.app-layout { min-height: 100vh; display: flex; flex-direction: column; }
.main-content { flex: 1; }

/* ─── 导航栏 ─── */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.navbar.scrolled {
  border-bottom-color: #e8edf2;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
}
.nav-inner {
  max-width: 1200px; margin: 0 auto;
  padding: 0 32px; height: 64px;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-logo {
  display: flex; align-items: center; gap: 8px;
  font-weight: 800; font-size: 18px; color: var(--primary);
  text-decoration: none;
}
.logo-icon { font-size: 14px; }
.logo-text { letter-spacing: 1px; }
.nav-center { display: flex; align-items: center; gap: 8px; }
.nav-link {
  padding: 6px 14px; border-radius: 8px;
  font-size: 14px; font-weight: 500; color: var(--text-2);
  transition: background 0.15s, color 0.15s;
}
.nav-link:hover { background: #f0f6ff; color: var(--primary); }
.nav-link.router-link-active { color: var(--primary); background: var(--primary-light); }
.nav-right { display: flex; align-items: center; gap: 10px; }
.btn-login {
  background: var(--primary); color: #fff;
  border: none; border-radius: 8px;
  padding: 8px 22px; font-size: 14px; font-weight: 600;
  letter-spacing: 2px;
  transition: background 0.15s, box-shadow 0.15s;
}
.btn-login:hover { background: var(--primary-dark); box-shadow: 0 4px 12px rgba(22,119,255,0.3); }
.nav-user-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; color: var(--text-2);
  background: var(--primary-light); border-radius: 8px;
  padding: 6px 14px; font-weight: 500;
}
.user-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #52c41a;
}
.btn-logout {
  background: transparent; color: #bbb; border: none;
  font-size: 13px; padding: 6px 10px;
  transition: color 0.15s;
}
.btn-logout:hover { color: var(--danger); }

/* ─── Footer ─── */
.footer {
  border-top: 1px solid var(--border);
  background: #fff;
  padding: 20px 32px;
}
.footer-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; gap: 12px;
  font-size: 13px; color: var(--text-3);
}
.footer-logo { font-weight: 700; color: var(--primary); font-size: 14px; }
.footer-sep { color: var(--border); }

/* ─── 登录弹窗 ─── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(13,17,23,0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 24px;
}
.modal-card {
  background: #fff; border-radius: 20px;
  padding: 48px 40px 40px;
  width: 100%; max-width: 400px;
  position: relative;
  box-shadow: 0 24px 80px rgba(0,0,0,0.2);
}
.modal-close {
  position: absolute; top: 18px; right: 20px;
  background: none; border: none;
  font-size: 16px; color: #ccc;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.modal-close:hover { background: #f5f5f5; color: #666; }
.modal-logo {
  font-size: 28px; color: var(--primary);
  font-weight: 900; margin-bottom: 16px;
}
.modal-title { font-size: 22px; font-weight: 800; color: var(--text-1); margin-bottom: 8px; }
.modal-desc { font-size: 14px; color: var(--text-3); margin-bottom: 28px; line-height: 1.6; }
.modal-field { margin-bottom: 16px; }
.modal-field label { display: block; font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 8px; }
.modal-input {
  width: 100%; border: 1.5px solid var(--border);
  border-radius: 10px; padding: 12px 16px;
  font-size: 15px; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.modal-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(22,119,255,0.12);
}
.modal-btn {
  width: 100%; background: linear-gradient(135deg, var(--primary), #4096ff);
  color: #fff; border: none; border-radius: 10px;
  padding: 14px; font-size: 16px; font-weight: 700;
  box-shadow: 0 6px 20px rgba(22,119,255,0.3);
  transition: opacity 0.15s, box-shadow 0.15s;
  margin-bottom: 14px;
}
.modal-btn:hover:not(:disabled) { box-shadow: 0 8px 28px rgba(22,119,255,0.4); }
.modal-btn:disabled { opacity: 0.6; box-shadow: none; }
.modal-hint { text-align: center; font-size: 12px; color: #ccc; }

/* ─── 弹窗过渡动画 ─── */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform 0.2s, opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.95) translateY(10px); opacity: 0; }
</style>
