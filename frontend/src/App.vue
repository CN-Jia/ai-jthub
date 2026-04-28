<template>
  <div class="app-layout">
    <!-- 顶部导航 -->
    <nav class="navbar" :class="{ scrolled: isScrolled }">
      <div class="nav-inner">
        <router-link to="/" class="nav-logo" @click="closeMobileMenu">
          <span class="logo-icon">⚡</span>
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
          </template>
        </div>

        <div class="nav-right">
          <template v-if="!store.isLoggedIn">
            <router-link to="/login" class="btn-text hide-sm">登录</router-link>
            <router-link to="/register" class="btn-primary-sm">注册</router-link>
          </template>
          <template v-else>
            <router-link to="/profile" class="nav-user hide-sm">
              <span class="user-avatar">{{ avatarChar }}</span>
              <span>{{ store.nickname }}</span>
            </router-link>
            <button class="btn-text hide-sm" @click="handleLogout">退出</button>
          </template>

          <!-- 汉堡菜单 -->
          <button class="hamburger show-sm-only" @click="mobileOpen = !mobileOpen" :class="{ open: mobileOpen }">
            <span /><span /><span />
          </button>
        </div>
      </div>

      <!-- 移动端抽屉菜单 -->
      <Transition name="slide-down">
        <div v-if="mobileOpen" class="mobile-menu show-sm-only">
          <router-link to="/" class="mobile-link" @click="closeMobileMenu">首页</router-link>
          <router-link to="/activity" class="mobile-link" @click="closeMobileMenu">活动公告</router-link>
          <router-link to="/forum" class="mobile-link" @click="closeMobileMenu">论坛</router-link>
          <template v-if="store.isLoggedIn">
            <router-link to="/submit" class="mobile-link" @click="closeMobileMenu">提交需求</router-link>
            <router-link to="/my-orders" class="mobile-link" @click="closeMobileMenu">我的订单</router-link>
            <router-link to="/feedback" class="mobile-link" @click="closeMobileMenu">意见反馈</router-link>
            <router-link to="/profile" class="mobile-link" @click="closeMobileMenu">个人中心</router-link>
            <button class="mobile-link mobile-logout" @click="handleLogout">退出登录</button>
          </template>
          <template v-else>
            <router-link to="/login" class="mobile-link" @click="closeMobileMenu">登录</router-link>
            <router-link to="/register" class="mobile-link mobile-register" @click="closeMobileMenu">注册账号</router-link>
          </template>
        </div>
      </Transition>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">⚡ JT-Hub</div>
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
import { useRouter } from 'vue-router'
import { useUserStore } from './store/user'

const store = useUserStore()
const router = useRouter()
const isScrolled = ref(false)
const mobileOpen = ref(false)

const avatarChar = computed(() => store.nickname ? store.nickname[0] : 'U')

function onScroll() { isScrolled.value = window.scrollY > 10 }
function closeMobileMenu() { mobileOpen.value = false }
onMounted(() => window.addEventListener('scroll', onScroll))
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
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.navbar.scrolled {
  border-bottom-color: var(--border);
  box-shadow: var(--shadow-sm);
}
.nav-inner {
  max-width: 1200px; margin: 0 auto;
  padding: 0 20px; height: var(--nav-h);
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px;
}
.nav-logo {
  display: flex; align-items: center; gap: 8px;
  font-weight: 800; font-size: 18px; color: var(--primary);
  white-space: nowrap; flex-shrink: 0;
}
.logo-icon { font-size: 16px; }

.nav-center { display: flex; align-items: center; gap: 2px; flex: 1; }
.nav-link {
  padding: 6px 12px; border-radius: 8px;
  font-size: 14px; font-weight: 500; color: var(--text-2);
  transition: background 0.15s, color 0.15s; white-space: nowrap;
}
.nav-link:hover, .nav-link.active { color: var(--primary); background: var(--primary-light); }

.nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.btn-text {
  background: none; border: none; padding: 6px 12px;
  font-size: 14px; font-weight: 500; color: var(--text-2);
  border-radius: 8px; cursor: pointer; white-space: nowrap;
  transition: color 0.15s;
}
.btn-text:hover { color: var(--primary); }

.btn-primary-sm {
  background: var(--primary); color: #fff;
  padding: 7px 18px; border-radius: 8px;
  font-size: 14px; font-weight: 600; white-space: nowrap;
  transition: background 0.15s, box-shadow 0.15s;
}
.btn-primary-sm:hover { background: var(--primary-dark); box-shadow: 0 4px 12px rgba(22,119,255,0.3); }

.nav-user {
  display: flex; align-items: center; gap: 8px;
  background: var(--primary-light); border-radius: 8px;
  padding: 5px 12px; font-size: 14px; color: var(--primary); font-weight: 500;
}
.user-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--primary); color: #fff;
  font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

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
.hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* ── 移动端菜单 ── */
.mobile-menu {
  background: #fff; border-top: 1px solid var(--border);
  padding: 8px 0;
}
.mobile-link {
  display: block; padding: 13px 20px;
  font-size: 15px; font-weight: 500; color: var(--text-2);
  border: none; background: none; width: 100%; text-align: left;
  cursor: pointer; border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s, color 0.12s;
}
.mobile-link:last-child { border-bottom: none; }
.mobile-link:hover { background: var(--primary-light); color: var(--primary); }
.mobile-logout { color: var(--danger); }
.mobile-register { color: var(--primary); font-weight: 700; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

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
