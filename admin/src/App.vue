<template>
  <el-container style="height:100vh">
    <el-aside width="200px" style="background:#001529">
      <div class="logo">JT-Hub 管理</div>
      <el-menu router background-color="#001529" text-color="#fff" active-text-color="#1677ff" :default-active="$route.path">
        <el-menu-item index="/"><el-icon><Odometer /></el-icon>数据概览</el-menu-item>
        <el-menu-item index="/orders"><el-icon><List /></el-icon>订单管理</el-menu-item>
        <el-menu-item index="/order-types"><el-icon><Setting /></el-icon>需求类型</el-menu-item>
        <el-menu-item index="/activities"><el-icon><Bell /></el-icon>活动管理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="background:#fff;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between">
        <span style="font-weight:500;color:#333">{{ pageTitle }}</span>
        <el-button text @click="handleLogout">退出登录</el-button>
      </el-header>
      <el-main style="background:#f5f7fa">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from './store/admin'

const router = useRouter()
const route = useRoute()
const store = useAdminStore()

const titleMap: Record<string, string> = {
  '/': '数据概览',
  '/orders': '订单管理',
  '/order-types': '需求类型管理',
  '/activities': '活动管理',
}
const pageTitle = computed(() => {
  if (route.path.startsWith('/orders/')) return '订单详情'
  return titleMap[route.path] ?? 'JT-Hub 管理后台'
})

function handleLogout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
.logo { color:#fff; font-size:18px; font-weight:bold; padding:20px 16px; text-align:center; border-bottom:1px solid #1f2d3d; }
</style>
