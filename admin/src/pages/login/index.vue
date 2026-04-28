<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="login-logo">⚡</span>
        <h1 class="login-title">JT-Hub 管理中心</h1>
        <p class="login-sub">Admin Console</p>
      </div>

      <el-form :model="form" @submit.prevent="handleLogin" class="login-form">
        <el-form-item>
          <el-input v-model="form.username" placeholder="管理员账号" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="登录密码" size="large" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item style="margin-bottom:0">
          <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <p class="login-footer">仅限授权管理员访问</p>
    </div>

    <!-- 背景装饰 -->
    <div class="bg-glow" />
    <div class="bg-glow-2" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAdminStore } from '../../store/admin'
import { api } from '../../api'

const router = useRouter()
const store = useAdminStore()
const loading = ref(false)
const form = ref({ username: '', password: '' })

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    return ElMessage.warning('请填写账号和密码')
  }
  loading.value = true
  try {
    const res: any = await api.login(form.value.username, form.value.password)
    store.setToken(res.data.token)
    router.replace('/')
  } catch (err: any) {
    ElMessage.error(err?.message ?? '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.bg-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  pointer-events: none;
}
.bg-glow-2 {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  bottom: -80px;
  left: -80px;
  pointer-events: none;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 400px;
  background: #1e293b;
  border: 1px solid #2d3748;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.login-header { text-align: center; margin-bottom: 32px; }
.login-logo { font-size: 40px; }
.login-title { font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 12px 0 4px; }
.login-sub { font-size: 13px; color: #64748b; letter-spacing: 0.05em; }

.login-form { display: flex; flex-direction: column; gap: 0; }

.login-footer { text-align: center; margin-top: 20px; font-size: 12px; color: #475569; }
</style>
