<template>
  <div class="app-layout">
    <!-- 顶部导航 -->
    <nav class="navbar" :class="{ scrolled: isScrolled, transparent: navTransparent }">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo" @click="closeMobileMenu">
          <JtLogo :size="28" />
          <span class="logo-text">JT-Hub</span>
        </router-link>

        <!-- 桌面导航 -->
        <div class="nav-center hide-sm">
          <router-link to="/" class="nav-link" exact-active-class="active">首页</router-link>
          <router-link to="/activity" class="nav-link" active-class="active">活动公告</router-link>
          <router-link to="/forum" class="nav-link" active-class="active">论坛</router-link>
          <template v-if="store.isLoggedIn">
            <router-link to="/submit" class="nav-link" active-class="active">提交需求</router-link>
            <router-link to="/my-orders" class="nav-link" active-class="active">我的订单</router-link>
            <router-link to="/feedback" class="nav-link" active-class="active">意见反馈</router-link>
            <router-link to="/points" class="nav-link" active-class="active">我的积分</router-link>
            <router-link to="/invite" class="nav-link" active-class="active">邀请好友</router-link>
          </template>
        </div>

        <div class="nav-right">
          <template v-if="!store.isLoggedIn">
            <router-link to="/login" class="nav-login hide-sm">登录</router-link>
            <router-link to="/register" class="nav-register hide-sm">免费注册</router-link>
          </template>
          <template v-else>
            <router-link to="/profile" class="nav-user hide-sm">
              <span class="user-avatar">{{ avatarChar }}</span>
              <span class="user-name">{{ store.nickname }}</span>
            </router-link>
            <button class="nav-logout hide-sm" @click="handleLogout">退出</button>
          </template>

          <!-- 汉堡菜单按钮 -->
          <button class="hamburger show-sm-only" @click="mobileOpen = !mobileOpen" :class="{ open: mobileOpen }">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>

    <!-- 移动端菜单遮罩（position:fixed，脱离 nav stacking context） -->
    <Transition name="fade">
      <div v-if="mobileOpen" class="mobile-backdrop show-sm-only" @click="closeMobileMenu" />
    </Transition>
    <Transition name="slide-down">
      <div v-if="mobileOpen" class="mobile-drawer show-sm-only">
        <router-link to="/" class="mobile-link" @click="closeMobileMenu">首页</router-link>
        <router-link to="/activity" class="mobile-link" @click="closeMobileMenu">活动公告</router-link>
        <router-link to="/forum" class="mobile-link" @click="closeMobileMenu">论坛</router-link>
        <template v-if="store.isLoggedIn">
          <router-link to="/submit" class="mobile-link" @click="closeMobileMenu">提交需求</router-link>
          <router-link to="/my-orders" class="mobile-link" @click="closeMobileMenu">我的订单</router-link>
          <router-link to="/feedback" class="mobile-link" @click="closeMobileMenu">意见反馈</router-link>
          <router-link to="/points" class="mobile-link" @click="closeMobileMenu">我的积分</router-link>
          <router-link to="/invite" class="mobile-link" @click="closeMobileMenu">邀请好友</router-link>
          <router-link to="/profile" class="mobile-link" @click="closeMobileMenu">个人中心</router-link>
          <button class="mobile-link mobile-logout" @click="handleLogout">退出登录</button>
        </template>
        <template v-else>
          <router-link to="/login" class="mobile-link" @click="closeMobileMenu">登录</router-link>
          <router-link to="/register" class="mobile-link mobile-register" @click="closeMobileMenu">注册账号</router-link>
        </template>
      </div>
    </Transition>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo"><JtLogo :size="22" style="display:inline-block;vertical-align:middle;margin-right:6px"/> JT-Hub</div>
        <div class="footer-info">
          <span>联系管理员微信：<strong>Jt--04</strong></span>
          <span class="footer-sep">·</span>
          <span>专业学业辅助平台</span>
        </div>
        <div class="footer-copy">© 2024 JT-Hub. All rights reserved.</div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './store/user'
import JtLogo from './components/JtLogo.vue'

const store = useUserStore()
const router = useRouter()
const route = useRoute()
const scrollY = ref(0)
const mobileOpen = ref(false)

const isScrolled = computed(() => scrollY.value > 20)
const isAtTop = computed(() => scrollY.value < 10)
const isHome = computed(() => route.path === '/')
const navTransparent = computed(() => isHome.value && isAtTop.value)

const avatarChar = computed(() => store.nickname ? store.nickname[0].toUpperCase() : 'U')

function onScroll() { scrollY.value = window.scrollY }
function closeMobileMenu() { mobileOpen.value = false }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

function handleLogout() {
  store.logout()
  closeMobileMenu()
  router.push('/')
}
</script>

<style scoped>
/* ── 布局 ── */
.app-layout { min-height: 100vh; display: flex; flex-direction: column; }
.main-content { flex: 1; }

/* ── 导航 ── */
.navbar {
  position: sticky; top: 0; z-index: 200;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-bottom: 1px solid rgba(229,231,235,0.8);
  transition: background 0.35s, border-color 0.35s, box-shadow 0.35s;
}
.navbar.transparent {
  background: transparent;
  border-bottom-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.navbar.scrolled {
  box-shadow: 0 1px 20px rgba(0,0,0,0.06);
}
.nav-inner {
  max-width: 1200px; margin: 0 auto;
  padding: 0 24px; height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px;
}
.nav-logo {
  display: flex; align-items: center; gap: 9px;
  font-weight: 800; font-size: 17px; color: var(--primary);
  white-space: nowrap; flex-shrink: 0;
  letter-spacing: -0.3px;
  transition: opacity 0.15s;
}
.navbar.transparent .nav-logo { color: #fff; }
.nav-logo:hover { opacity: 0.85; }
.logo-text { background: linear-gradient(135deg, var(--primary), #4096ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.navbar.transparent .logo-text { background: none; -webkit-text-fill-color: #fff; }

.nav-center { display: flex; align-items: center; gap: 0; flex: 1; padding-left: 8px; }
.nav-link {
  position: relative;
  padding: 6px 13px; border-radius: 8px;
  font-size: 14px; font-weight: 500; color: var(--text-2);
  transition: color 0.15s; white-space: nowrap;
}
.nav-link::after {
  content: ''; position: absolute; bottom: -2px; left: 13px; right: 13px;
  height: 2px; border-radius: 2px;
  background: var(--primary);
  transform: scaleX(0); transform-origin: center;
  transition: transform 0.2s ease;
}
.nav-link:hover { color: var(--primary); }
.nav-link:hover::after { transform: scaleX(0.6); }
.nav-link.active { color: var(--primary); font-weight: 600; }
.nav-link.active::after { transform: scaleX(1); }
.navbar.transparent .nav-link { color: rgba(255,255,255,0.85); }
.navbar.transparent .nav-link:hover { color: #fff; }
.navbar.transparent .nav-link.active { color: #fff; }
.navbar.transparent .nav-link::after { background: #fff; }

.nav-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

.nav-login {
  padding: 7px 14px; border-radius: 8px;
  font-size: 14px; font-weight: 500; color: var(--text-2);
  transition: color 0.15s, background 0.15s;
}
.nav-login:hover { color: var(--primary); background: var(--primary-light); }
.navbar.transparent .nav-login { color: rgba(255,255,255,0.85); }
.navbar.transparent .nav-login:hover { color: #fff; background: rgba(255,255,255,0.1); }

.nav-register {
  background: var(--primary); color: #fff;
  padding: 7px 18px; border-radius: 8px;
  font-size: 14px; font-weight: 600; white-space: nowrap;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
  box-shadow: 0 2px 8px rgba(22,119,255,0.25);
}
.nav-register:hover { background: var(--primary-dark); box-shadow: 0 4px 16px rgba(22,119,255,0.35); transform: translateY(-1px); }
.navbar.transparent .nav-register { background: rgba(255,255,255,0.18); box-shadow: none; border: 1px solid rgba(255,255,255,0.35); }
.navbar.transparent .nav-register:hover { background: rgba(255,255,255,0.28); }

.nav-user {
  display: flex; align-items: center; gap: 8px;
  border-radius: 10px; padding: 5px 12px 5px 6px;
  font-size: 14px; color: var(--text-2); font-weight: 500;
  transition: background 0.15s;
}
.nav-user:hover { background: var(--primary-light); color: var(--primary); }
.user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #4096ff);
  color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(22,119,255,0.3);
}
.user-name { font-weight: 600; }

.nav-logout {
  background: none; border: none; padding: 7px 12px;
  font-size: 13px; color: var(--text-3);
  border-radius: 8px; cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.nav-logout:hover { color: var(--danger); background: #fff1f0; }

/* ── 汉堡 ── */
.hamburger {
  background: none; border: none; padding: 6px;
  display: flex; flex-direction: column; gap: 5px; cursor: pointer;
}
.hamburger span {
  display: block; width: 22px; height: 2px;
  background: var(--text-2); border-radius: 2px;
  transition: all 0.25s;
}
.navbar.transparent .hamburger span { background: rgba(255,255,255,0.9); }
.hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* ── 移动端菜单（fixed，脱离 nav stacking context） ── */
.mobile-backdrop {
  position: fixed; inset: 0; top: var(--nav-h);
  background: rgba(0,0,0,0.25);
  z-index: 998;
}
.mobile-drawer {
  position: fixed; top: var(--nav-h); left: 0; right: 0;
  background: #fff; border-bottom: 1px solid var(--border);
  padding: 8px 0;
  z-index: 999;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.mobile-link {
  display: block; padding: 13px 20px;
  font-size: 15px; font-weight: 500; color: var(--text-2);
  border: none; background: none; width: 100%; text-align: left;
  cursor: pointer; border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s, color 0.12s;
}
.mobile-link:last-child { border-bottom: none; }
.mobile-link:hover, .mobile-link:active { background: var(--primary-light); color: var(--primary); }
.mobile-logout { color: var(--danger); }
.mobile-register { color: var(--primary); font-weight: 700; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Footer ── */
.footer {
  background: var(--white); border-top: 1px solid var(--border);
  padding: 24px 20px;
}
.footer-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; text-align: center;
}
.footer-logo { font-size: 18px; font-weight: 800; color: var(--primary); }
.footer-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-3); flex-wrap: wrap; justify-content: center; }
.footer-sep { color: var(--border); }
.footer-copy { font-size: 12px; color: #d1d5db; }
</style>
