<template>
  <div class="al" :class="{ collapsed }">
    <!-- ═══ 侧边栏 ═══ -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sl-logo">
        <JtLogo :size="collapsed ? 32 : 36" />
        <Transition name="fade-slide">
          <div v-if="!collapsed" class="sl-brand">
            <span class="brand-name">JT-Hub</span>
            <span class="brand-sub">ADMIN</span>
          </div>
        </Transition>
      </div>

      <!-- 导航 -->
      <nav class="sl-nav">
        <template v-for="group in navGroups" :key="group.label">
          <!-- 分组标题 -->
          <div v-if="!collapsed" class="sl-group-label">
            <span class="gl-line" />
            <span class="gl-text">{{ group.label }}</span>
            <span class="gl-line" />
          </div>
          <div v-else class="sl-group-sep" />

          <!-- 菜单项 -->
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            class="sl-item"
            :class="{ active: isActive(item.path) }"
          >
            <span class="si-icon">
              <el-icon><component :is="item.icon" /></el-icon>
            </span>
            <Transition name="fade-slide">
              <span v-if="!collapsed" class="si-label">{{ item.label }}</span>
            </Transition>
            <span v-if="!collapsed && item.badge" class="si-badge">{{ item.badge }}</span>
          </router-link>
        </template>
      </nav>

      <!-- 底部折叠按钮 -->
      <div class="sl-footer">
        <button class="collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开' : '收起'">
          <el-icon><component :is="collapsed ? 'DArrowRight' : 'DArrowLeft'" /></el-icon>
        </button>
      </div>
    </aside>

    <!-- ═══ 主区域 ═══ -->
    <div class="main-wrap">
      <!-- Topbar -->
      <header class="topbar">
        <div class="tb-left">
          <!-- 面包屑光标 -->
          <span class="tb-cursor">▶</span>
          <span class="tb-title">{{ pageTitle }}</span>
        </div>
        <div class="tb-right">
          <span class="tb-dot online" />
          <span class="tb-dot-label">在线</span>
          <div class="tb-divider" />
          <span class="tb-admin">Admin</span>
          <button class="tb-logout" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出</span>
          </button>
        </div>
      </header>

      <!-- 内容 -->
      <main class="page-body">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from './store/admin'
import JtLogo from './components/JtLogo.vue'

const router = useRouter()
const route = useRoute()
const store = useAdminStore()
const collapsed = ref(false)

const navGroups = [
  {
    label: '概览',
    items: [
      { path: '/',        label: '数据概览', icon: 'Odometer' },
      { path: '/monitor', label: '系统监控', icon: 'Monitor' },
    ],
  },
  {
    label: '业务管理',
    items: [
      { path: '/orders',      label: '订单管理',  icon: 'List' },
      { path: '/order-types', label: '需求类型',  icon: 'Grid' },
      { path: '/activities',  label: '活动公告',  icon: 'Bell' },
    ],
  },
  {
    label: '内容管理',
    items: [
      { path: '/posts',    label: '论坛管理', icon: 'ChatDotRound' },
      { path: '/carousel', label: '作品轮播', icon: 'Picture' },
      { path: '/feedback', label: '用户反馈', icon: 'Comment' },
    ],
  },
  {
    label: '系统',
    items: [
      { path: '/users', label: '用户管理', icon: 'User' },
    ],
  },
  {
    label: '积分系统',
    items: [
      { path: '/points',        label: '积分规则', icon: 'Coin' },
      { path: '/points/shop',   label: '积分商城', icon: 'ShoppingCart' },
      { path: '/points/redeem', label: '兑换审核', icon: 'Tickets' },
    ],
  },
]

const titleMap: Record<string, string> = {
  '/': '数据概览',
  '/monitor': '系统监控',
  '/orders': '订单管理',
  '/order-types': '需求类型管理',
  '/activities': '活动公告',
  '/posts': '论坛管理',
  '/carousel': '作品轮播',
  '/feedback': '用户反馈',
  '/users': '用户管理',
  '/points': '积分管理',
  '/points/shop': '积分商城',
  '/points/redeem': '兑换订单审核',
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/orders/')) return '订单详情'
  return titleMap[route.path] ?? 'JT-Hub 管理后台'
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleLogout() {
  store.logout()
  router.push('/login')
}
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app { height: 100%; }

:root {
  --bg-deep:     #030711;
  --bg-surface:  #080f1e;
  --bg-panel:    #0d1b2e;
  --bg-hover:    rgba(0,212,255,0.06);
  --accent:      #00d4ff;
  --accent-dim:  rgba(0,212,255,0.14);
  --accent-glow: rgba(0,212,255,0.35);
  --purple:      #a855f7;
  --purple-dim:  rgba(168,85,247,0.14);
  --border:      rgba(0,212,255,0.1);
  --border-mid:  rgba(0,212,255,0.2);
  --text-hi:     #e8f0fe;
  --text-md:     #7fa5c0;
  --text-lo:     #3d5a70;
  --success:     #10d98a;
  --warning:     #f59e0b;
  --danger:      #ef4444;
  --sidebar-w:   240px;
  --sidebar-col: 64px;
  --topbar-h:    58px;
  --radius:      10px;
}

body { background: var(--bg-deep); }

/* scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-mid); }
</style>

<style scoped>
/* ══════════════ Layout ══════════════ */
.al {
  display: flex;
  height: 100vh;
  background: var(--bg-deep);
  color: var(--text-hi);
  overflow: hidden;
}

/* ══════════════ Sidebar ══════════════ */
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  transition: width 0.28s cubic-bezier(.4,0,.2,1);
  position: relative;
  overflow: hidden;
}

/* dot-grid sci-fi pattern */
.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 1.5px 1.5px, rgba(0,212,255,0.07) 1.5px, transparent 0);
  background-size: 22px 22px;
  pointer-events: none;
  z-index: 0;
}

/* top scan-line glow */
.sidebar::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}

.al.collapsed .sidebar { width: var(--sidebar-col); }

/* Logo area */
.sl-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  height: var(--topbar-h);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.sl-brand {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.brand-name {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-hi);
  letter-spacing: 0.04em;
  white-space: nowrap;
  line-height: 1.2;
}
.brand-sub {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: var(--accent);
  white-space: nowrap;
  opacity: 0.8;
}

/* Nav */
.sl-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
  position: relative;
  z-index: 2;
}

.sl-group-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 12px 5px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-lo);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  white-space: nowrap;
}
.gl-line {
  flex: 1;
  height: 1px;
  background: var(--border);
}
.gl-text { flex-shrink: 0; }

.sl-group-sep {
  height: 1px;
  background: var(--border);
  margin: 10px 8px;
}

.sl-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  margin: 1px 6px;
  border-radius: 8px;
  color: var(--text-md);
  text-decoration: none;
  font-size: 13.5px;
  white-space: nowrap;
  transition: all 0.18s ease;
  position: relative;
  overflow: hidden;
}
.sl-item::before {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
  transition: height 0.2s ease;
  box-shadow: 0 0 8px var(--accent-glow);
}
.sl-item:hover {
  background: var(--bg-hover);
  color: var(--text-hi);
}
.sl-item.active {
  background: var(--accent-dim);
  color: var(--accent);
}
.sl-item.active::before { height: 60%; }
.si-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
  flex-shrink: 0;
}
.si-label { flex: 1; }
.si-badge {
  font-size: 10px;
  background: var(--accent);
  color: #030711;
  border-radius: 99px;
  padding: 1px 6px;
  font-weight: 700;
  flex-shrink: 0;
}

/* Footer */
.sl-footer {
  border-top: 1px solid var(--border);
  padding: 10px 6px;
  position: relative;
  z-index: 2;
}
.collapse-btn {
  width: 100%;
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-md);
  padding: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: all 0.18s;
}
.collapse-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-mid);
  color: var(--accent);
}

/* ══════════════ Main ══════════════ */
.main-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Topbar */
.topbar {
  height: var(--topbar-h);
  flex-shrink: 0;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: relative;
}
.topbar::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-dim), transparent);
}

.tb-left { display: flex; align-items: center; gap: 8px; }
.tb-cursor {
  font-size: 10px;
  color: var(--accent);
  animation: blink 1.2s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }
.tb-title { font-size: 15px; font-weight: 600; color: var(--text-hi); letter-spacing: 0.02em; }

.tb-right { display: flex; align-items: center; gap: 10px; }
.tb-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.tb-dot-label { font-size: 12px; color: var(--success); }
.tb-divider { width: 1px; height: 18px; background: var(--border); }
.tb-admin { font-size: 13px; color: var(--text-md); }
.tb-logout {
  display: flex; align-items: center; gap: 5px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-md);
  font-size: 12px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.18s;
}
.tb-logout:hover { border-color: var(--danger); color: var(--danger); }

/* Page body */
.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-deep);
}

/* ══════════════ Transitions ══════════════ */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-slide-enter-from { opacity: 0; transform: translateX(-6px); }
.fade-slide-leave-to   { opacity: 0; transform: translateX(-6px); }
</style>
