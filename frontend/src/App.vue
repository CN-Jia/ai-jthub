<template>
  <div class="app-layout">
    <!-- 鼠标粒子特效 canvas -->
    <canvas ref="cursorCvs" class="cursor-canvas" />

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
            <router-link to="/products" class="nav-link" active-class="active">立即选购</router-link>
            <router-link to="/orders" class="nav-link" active-class="active">我的订单</router-link>
            <router-link to="/points" class="nav-link" active-class="active">积分</router-link>
            <router-link to="/invite" class="nav-link" active-class="active">邀请</router-link>
          </template>
        </div>

        <!-- 运行时长 -->
        <div class="nav-uptime hide-sm" v-if="uptimeStr">
          <span class="uptime-dot" />
          <span>运行 {{ uptimeStr }}</span>
        </div>

        <div class="nav-right">
          <!-- 主题切换按钮 -->
          <button class="theme-toggle" :title="isDark ? '切换亮色' : '切换暗色'" @click="toggleTheme">
            <svg v-if="isDark" class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>

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

    <!-- 移动端菜单遮罩 -->
    <Transition name="fade">
      <div v-if="mobileOpen" class="mobile-backdrop show-sm-only" @click="closeMobileMenu" />
    </Transition>
    <Transition name="slide-down">
      <div v-if="mobileOpen" class="mobile-drawer show-sm-only">
        <router-link to="/" class="mobile-link" @click="closeMobileMenu">首页</router-link>
        <router-link to="/activity" class="mobile-link" @click="closeMobileMenu">活动公告</router-link>
        <router-link to="/forum" class="mobile-link" @click="closeMobileMenu">论坛</router-link>
        <template v-if="store.isLoggedIn">
          <router-link to="/products" class="mobile-link" @click="closeMobileMenu">立即选购</router-link>
          <router-link to="/orders" class="mobile-link" @click="closeMobileMenu">我的订单</router-link>
          <router-link to="/points" class="mobile-link" @click="closeMobileMenu">我的积分</router-link>
          <router-link to="/invite" class="mobile-link" @click="closeMobileMenu">邀请好友</router-link>
          <router-link to="/profile" class="mobile-link" @click="closeMobileMenu">个人中心</router-link>
          <button class="mobile-link mobile-logout" @click="handleLogout">退出登录</button>
        </template>
        <template v-else>
          <router-link to="/login" class="mobile-link" @click="closeMobileMenu">登录</router-link>
          <router-link to="/register" class="mobile-link mobile-register" @click="closeMobileMenu">注册账号</router-link>
        </template>
        <!-- 移动端主题切换 -->
        <button class="mobile-link mobile-theme" @click="toggleTheme; closeMobileMenu()">
          {{ isDark ? '☀️ 切换亮色模式' : '🌙 切换暗色模式' }}
        </button>
      </div>
    </Transition>

    <main class="main-content">
      <router-view />
    </main>

    <!-- 移动端底部导航栏 -->
    <nav class="bottom-nav show-sm-only">
      <router-link to="/" class="bn-item" exact-active-class="bn-active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>首页</span>
      </router-link>
      <router-link to="/forum" class="bn-item" active-class="bn-active">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>论坛</span>
      </router-link>

      <!-- 中间突出按钮 -->
      <div class="bn-center">
        <button class="bn-submit" @click="handleSubmit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span class="bn-submit-label">选购</span>
      </div>

      <template v-if="store.isLoggedIn">
        <router-link to="/orders" class="bn-item" active-class="bn-active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>订单</span>
        </router-link>
        <router-link to="/profile" class="bn-item" active-class="bn-active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>我的</span>
        </router-link>
      </template>
      <template v-else>
        <router-link to="/activity" class="bn-item" active-class="bn-active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          <span>活动</span>
        </router-link>
        <router-link to="/login" class="bn-item" active-class="bn-active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>登录</span>
        </router-link>
      </template>
    </nav>

    <footer class="footer hide-on-mobile">
      <div class="footer-inner">
        <div class="footer-logo"><JtLogo :size="22" style="display:inline-block;vertical-align:middle;margin-right:6px"/> JT-Hub</div>
        <div class="footer-info">
          <span>商务合作微信：<strong>Jt--04</strong>（备注来意）</span>
        </div>
        <div class="footer-copy">© 2026 JT-Hub. All rights reserved.</div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './store/user'
import { api } from './api'
import JtLogo from './components/JtLogo.vue'

const store = useUserStore()
const router = useRouter()
const route = useRoute()
const scrollY = ref(0)
const mobileOpen = ref(false)
const uptimeStr = ref('')
const cursorCvs = ref<HTMLCanvasElement | null>(null)

/* ── 主题管理 ── */
const isDark = ref(false)

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
}

function initTheme() {
  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  }
  applyTheme(isDark.value)
}

/* ── 运行时长 ── */
function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}天${h}时`
  if (h > 0) return `${h}时${m}分`
  return `${m}分`
}

async function fetchUptime() {
  try {
    const res: any = await api.getHealth()
    const secs = res?.uptime ?? res?.data?.uptime
    if (secs != null) uptimeStr.value = formatUptime(secs)
  } catch {}
}

let uptimeTimer: ReturnType<typeof setInterval> | null = null

const isScrolled = computed(() => scrollY.value > 20)
const isAtTop = computed(() => scrollY.value < 10)
const isHome = computed(() => route.path === '/')
const navTransparent = computed(() => isHome.value && isAtTop.value)

const avatarChar = computed(() => store.nickname ? store.nickname[0].toUpperCase() : 'U')

function onScroll() { scrollY.value = window.scrollY }
function closeMobileMenu() { mobileOpen.value = false }

/* ── 鼠标粒子特效 ── */
interface CursorParticle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  r: number; hue: number
}

function initCursorParticles() {
  const el = cursorCvs.value
  if (!el) return

  const ctx = el.getContext('2d')!
  const particles: CursorParticle[] = []
  let mouse = { x: -999, y: -999 }
  let rafId = 0
  let isTouch = false

  function resize() {
    el.width = window.innerWidth
    el.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  function onMouseMove(e: MouseEvent) {
    isTouch = false
    mouse.x = e.clientX
    mouse.y = e.clientY
    // 每次移动喷出 2-3 个粒子
    const count = Math.random() < 0.5 ? 2 : 3
    for (let i = 0; i < count; i++) spawnParticle(mouse.x, mouse.y)
  }

  function spawnParticle(x: number, y: number) {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 1.5 + 0.5
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed * 0.6,
      vy: Math.sin(angle) * speed * 0.6 - 0.8,
      life: 1,
      maxLife: 1,
      r: Math.random() * 3 + 1.5,
      // 亮色模式用蓝紫色，暗色模式用青蓝色
      hue: dark
        ? 190 + Math.random() * 60   // 青到蓝 190~250
        : 210 + Math.random() * 50,  // 蓝到紫 210~260
    })
    // 控制粒子总数
    if (particles.length > 120) particles.splice(0, particles.length - 120)
  }

  function draw() {
    ctx.clearRect(0, 0, el.width, el.height)
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= 0.035
      if (p.life <= 0) { particles.splice(i, 1); continue }

      p.x += p.vx
      p.y += p.vy
      p.vy += 0.04  // 轻微重力
      p.vx *= 0.97  // 阻尼

      const alpha = p.life * (dark ? 0.85 : 0.6)
      const sat = dark ? '90%' : '80%'
      const lgt = dark ? '70%' : '55%'

      // 外发光
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
      glow.addColorStop(0, `hsla(${p.hue},${sat},${lgt},${alpha})`)
      glow.addColorStop(1, `hsla(${p.hue},${sat},${lgt},0)`)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()

      // 核心亮点
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue},${sat},${dark ? '92%' : '75%'},${alpha})`
      ctx.fill()
    }
    rafId = requestAnimationFrame(draw)
  }

  window.addEventListener('mousemove', onMouseMove)
  draw()

  return () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', resize)
    cancelAnimationFrame(rafId)
  }
}

let cleanupCursor: (() => void) | undefined

onMounted(() => {
  initTheme()
  window.addEventListener('scroll', onScroll, { passive: true })
  fetchUptime()
  uptimeTimer = setInterval(fetchUptime, 60_000)
  cleanupCursor = initCursorParticles()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  if (uptimeTimer) clearInterval(uptimeTimer)
  cleanupCursor?.()
})

function handleLogout() {
  store.logout()
  closeMobileMenu()
  router.push('/')
}

function handleSubmit() {
  closeMobileMenu()
  store.isLoggedIn ? router.push('/products') : router.push('/login')
}
</script>

<style scoped>
/* ── 鼠标粒子 canvas ── */
.cursor-canvas {
  position: fixed; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 9999;
}

/* ── 布局 ── */
.app-layout { min-height: 100vh; display: flex; flex-direction: column; }
.main-content { flex: 1; }

@media (max-width: 640px) {
  .main-content { padding-bottom: calc(60px + env(safe-area-inset-bottom)); }
  .hide-on-mobile { display: none !important; }
}

/* ══ 导航栏 ══ */
.navbar {
  position: sticky; top: 0; z-index: 200;
  background: var(--navbar-bg);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-bottom: 1px solid var(--navbar-border);
  transition: background 0.35s, border-color 0.35s, box-shadow 0.35s, backdrop-filter 0.35s;
}
.navbar.transparent {
  background: transparent;
  border-bottom-color: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
.navbar.scrolled {
  box-shadow: var(--navbar-shadow);
}
.nav-inner {
  max-width: 1200px; margin: 0 auto;
  padding: 0 20px; height: 64px;
  display: flex; align-items: center; gap: 4px;
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
.logo-text {
  background: linear-gradient(135deg, var(--primary), #4096ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.navbar.transparent .logo-text { background: none; -webkit-text-fill-color: rgba(255,255,255,0.95); }

.nav-center { display: flex; align-items: center; gap: 0; flex: 1; padding: 0 4px; min-width: 0; }
.nav-link {
  position: relative;
  padding: 6px 11px; border-radius: 8px;
  font-size: 13.5px; font-weight: 500; color: var(--text-2);
  transition: color 0.15s; white-space: nowrap;
}
.nav-link::after {
  content: ''; position: absolute; bottom: -1px; left: 11px; right: 11px;
  height: 2px; border-radius: 2px;
  background: var(--primary);
  transform: scaleX(0); transform-origin: center;
  transition: transform 0.2s ease;
}
.nav-link:hover { color: var(--primary); }
.nav-link:hover::after { transform: scaleX(0.6); }
.nav-link.active { color: var(--primary); font-weight: 600; }
.nav-link.active::after { transform: scaleX(1); }

/* 透明导航下 nav-link 变白 */
.navbar.transparent .nav-link { color: rgba(255,255,255,0.8); }
.navbar.transparent .nav-link:hover { color: #fff; }
.navbar.transparent .nav-link.active { color: #fff; }
.navbar.transparent .nav-link::after { background: rgba(255,255,255,0.9); }

/* 运行时长 */
.nav-uptime {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--text-3); white-space: nowrap;
  padding: 4px 10px; border-radius: 100px;
  background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
  transition: all 0.3s; flex-shrink: 0;
}
.navbar.transparent .nav-uptime {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.7);
}
.uptime-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16,185,129,0.25);
  animation: uptimePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes uptimePulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(16,185,129,0.25); }
  50% { box-shadow: 0 0 0 5px rgba(16,185,129,0.08); }
}

/* 右侧区域 */
.nav-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: 8px; }

/* 主题切换按钮 */
.theme-toggle {
  width: 34px; height: 34px; border-radius: 8px;
  background: none; border: 1.5px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-2);
  transition: all 0.15s;
  flex-shrink: 0;
}
.theme-toggle:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.theme-icon { width: 16px; height: 16px; }
.navbar.transparent .theme-toggle {
  border-color: rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.85);
}
.navbar.transparent .theme-toggle:hover {
  border-color: rgba(255,255,255,0.7);
  color: #fff;
  background: rgba(255,255,255,0.1);
}

.nav-login {
  padding: 7px 12px; border-radius: 8px;
  font-size: 13.5px; font-weight: 500; color: var(--text-2);
  transition: color 0.15s, background 0.15s;
}
.nav-login:hover { color: var(--primary); background: var(--primary-light); }
.navbar.transparent .nav-login { color: rgba(255,255,255,0.85); }
.navbar.transparent .nav-login:hover { color: #fff; background: rgba(255,255,255,0.1); }

.nav-register {
  background: var(--primary); color: #fff;
  padding: 7px 16px; border-radius: 8px;
  font-size: 13.5px; font-weight: 600; white-space: nowrap;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
  box-shadow: 0 2px 8px rgba(22,119,255,0.25);
}
.nav-register:hover { background: var(--primary-dark); box-shadow: 0 4px 16px rgba(22,119,255,0.35); transform: translateY(-1px); }
.navbar.transparent .nav-register { background: rgba(255,255,255,0.18); box-shadow: none; border: 1px solid rgba(255,255,255,0.35); }
.navbar.transparent .nav-register:hover { background: rgba(255,255,255,0.28); }

.nav-user {
  display: flex; align-items: center; gap: 7px;
  border-radius: 10px; padding: 5px 10px 5px 5px;
  font-size: 13.5px; color: var(--text-2); font-weight: 500;
  transition: background 0.15s;
}
.nav-user:hover { background: var(--primary-light); color: var(--primary); }
.user-avatar {
  width: 27px; height: 27px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #4096ff);
  color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(22,119,255,0.3);
}
.user-name { font-weight: 600; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.nav-logout {
  background: none; border: none; padding: 7px 10px;
  font-size: 13px; color: var(--text-3);
  border-radius: 8px; cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.nav-logout:hover { color: var(--danger); background: rgba(255,77,79,0.08); }

/* 汉堡菜单 */
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

/* ── 移动端菜单（fixed 脱离 nav stacking context） ── */
.mobile-backdrop {
  position: fixed; inset: 0; top: var(--nav-h);
  background: rgba(0,0,0,0.35); z-index: 998;
}
.mobile-drawer {
  position: fixed; top: var(--nav-h); left: 0; right: 0;
  background: var(--white);
  border-bottom: 1px solid var(--border);
  padding: 8px 0;
  z-index: 999;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.mobile-link {
  display: block; padding: 13px 20px;
  font-size: 15px; font-weight: 500; color: var(--text-2);
  border: none; background: none; width: 100%; text-align: left;
  cursor: pointer; border-bottom: 1px solid var(--border);
  transition: background 0.12s, color 0.12s;
}
.mobile-link:last-child { border-bottom: none; }
.mobile-link:hover, .mobile-link:active { background: var(--primary-light); color: var(--primary); }
.mobile-logout { color: var(--danger); }
.mobile-register { color: var(--primary); font-weight: 700; }
.mobile-theme { color: var(--text-3); }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── 底部导航栏 ── */
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: calc(60px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--navbar-bg);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-top: 1px solid var(--navbar-border);
  display: flex; align-items: stretch;
  z-index: 300;
  box-shadow: 0 -2px 20px rgba(0,0,0,0.08);
}
.bn-item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 3px; padding: 6px 0;
  color: var(--text-3); font-size: 10px; font-weight: 500;
  transition: color 0.15s; cursor: pointer;
}
.bn-item svg { width: 22px; height: 22px; stroke: currentColor; }
.bn-item span { line-height: 1; }
.bn-item:hover { color: var(--primary); }
.bn-item.bn-active { color: var(--primary); }
.bn-item.bn-active svg { stroke: var(--primary); }

/* 中间突出按钮 */
.bn-center {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 3px;
}
.bn-submit {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #4096ff);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(22,119,255,0.4);
  margin-top: -16px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.bn-submit:active { transform: scale(0.92); }
.bn-submit svg { width: 22px; height: 22px; stroke: #fff; }
.bn-submit-label {
  font-size: 10px; font-weight: 500; color: var(--primary); line-height: 1; margin-top: 2px;
}

/* ── Footer ── */
.footer {
  background: var(--white); border-top: 1px solid var(--border);
  padding: 24px 20px;
  transition: background 0.25s, border-color 0.25s;
}
.footer-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; text-align: center;
}
.footer-logo { font-size: 18px; font-weight: 800; color: var(--primary); }
.footer-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-3); flex-wrap: wrap; justify-content: center; }
.footer-copy { font-size: 12px; color: var(--text-3); opacity: 0.7; }
</style>
