<template>
  <div class="admin-layout" :class="{ collapsed }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">⚡</span>
        <span v-if="!collapsed" class="logo-text">JT-Hub 管理</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group-label" v-if="!collapsed">概览</div>
        <router-link v-for="item in menuItems.slice(0,1)" :key="item.path" :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
          <el-icon><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed">{{ item.label }}</span>
        </router-link>

        <div class="nav-group-label" v-if="!collapsed">业务管理</div>
        <router-link v-for="item in menuItems.slice(1,4)" :key="item.path" :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
          <el-icon><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed">{{ item.label }}</span>
        </router-link>

        <div class="nav-group-label" v-if="!collapsed">内容管理</div>
        <router-link v-for="item in menuItems.slice(4,7)" :key="item.path" :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
          <el-icon><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed">{{ item.label }}</span>
        </router-link>

        <div class="nav-group-label" v-if="!collapsed">系统</div>
        <router-link v-for="item in menuItems.slice(7)" :key="item.path" :to="item.path" class="nav-item" :class="{ active: isActive(item.path) }">
          <el-icon><component :is="item.icon" /></el-icon>
          <span v-if="!collapsed">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="collapse-btn" @click="collapsed = !collapsed">
          <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
        </button>
      </div>
    </aside>

    <!-- 主内容 -->
    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-left">
          <span class="page-title">{{ pageTitle }}</span>
        </div>
        <div class="topbar-right">
          <el-tag type="success" size="small" effect="plain">在线</el-tag>
          <span class="admin-name">Admin</span>
          <el-button size="small" class="logout-btn" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </header>

      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from './store/admin'

const router = useRouter()
const route = useRoute()
const store = useAdminStore()
const collapsed = ref(false)

const menuItems = [
  { path: '/', label: '数据概览', icon: 'Odometer' },
  { path: '/orders', label: '订单管理', icon: 'List' },
  { path: '/order-types', label: '需求类型', icon: 'Grid' },
  { path: '/activities', label: '活动公告', icon: 'Bell' },
  { path: '/posts', label: '论坛管理', icon: 'ChatDotRound' },
  { path: '/carousel', label: '作品轮播', icon: 'Picture' },
  { path: '/feedback', label: '用户反馈', icon: 'Comment' },
  { path: '/users', label: '用户管理', icon: 'User' },
]

const titleMap: Record<string, string> = {
  '/': '数据概览',
  '/orders': '订单管理',
  '/order-types': '需求类型管理',
  '/activities': '活动公告',
  '/posts': '论坛管理',
  '/carousel': '作品轮播',
  '/feedback': '用户反馈',
  '/users': '用户管理',
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
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app { height: 100%; }
body { background: #0f172a; }
</style>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

/* ── 侧边栏 ── */
.sidebar {
  width: 220px;
  background: #1e293b;
  border-right: 1px solid #2d3748;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  flex-shrink: 0;
}
.admin-layout.collapsed .sidebar {
  width: 60px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid #2d3748;
  min-height: 64px;
}
.logo-icon { font-size: 22px; }
.logo-text { font-size: 16px; font-weight: 700; color: #f1f5f9; white-space: nowrap; }

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 0;
}
.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

.nav-group-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 12px 16px 4px;
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  border-radius: 0;
  transition: all 0.15s;
  white-space: nowrap;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.nav-item:hover { background: #273449; color: #e2e8f0; }
.nav-item.active { background: #1e3a5f; color: #60a5fa; border-left-color: #3b82f6; }
.nav-item .el-icon { font-size: 16px; flex-shrink: 0; }

.sidebar-footer {
  border-top: 1px solid #2d3748;
  padding: 12px 16px;
}
.collapse-btn {
  background: none;
  border: 1px solid #2d3748;
  color: #64748b;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: all 0.15s;
}
.collapse-btn:hover { background: #273449; color: #94a3b8; }

/* ── 主区域 ── */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 64px;
  background: #1e293b;
  border-bottom: 1px solid #2d3748;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}
.page-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.admin-name { font-size: 14px; color: #94a3b8; }
.logout-btn { background: transparent; border-color: #334155; color: #94a3b8; }
.logout-btn:hover { border-color: #ef4444; color: #ef4444; background: transparent; }

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #0f172a;
}
</style>
