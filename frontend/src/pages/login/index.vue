<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <router-link to="/" class="auth-logo">⚡ JT-Hub</router-link>
        <h1 class="auth-title">欢迎回来</h1>
        <p class="auth-sub">登录以提交需求和查看订单</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label">邮箱 / 用户名</label>
          <input v-model="form.identifier" class="form-input" placeholder="输入邮箱或用户名" autocomplete="username" />
        </div>

        <div class="form-group">
          <label class="form-label">
            密码
            <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
          </label>
          <div class="input-eye">
            <input v-model="form.password" :type="showPwd ? 'text' : 'password'" class="form-input" placeholder="输入密码" autocomplete="current-password" />
            <button type="button" class="eye-btn" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</button>
          </div>
        </div>

        <div v-if="errorMsg" class="form-error" style="margin-top:-4px">{{ errorMsg }}</div>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
          <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px" />
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <p class="auth-switch">
        还没有账号？<router-link to="/register" class="auth-link">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../store/user'
import { api } from '../../api'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

const form = ref({ identifier: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')
const showPwd = ref(false)

async function handleLogin() {
  errorMsg.value = ''
  if (!form.value.identifier || !form.value.password) {
    errorMsg.value = '请填写账号和密码'
    return
  }
  loading.value = true
  try {
    const res: any = await api.login(form.value.identifier, form.value.password)
    const d = res.data
    store.setAuth(d.token, { id: d.userId, username: d.username, nickname: d.nickname, email: d.email, emailVerified: true })
    const redirect = route.query.redirect as string
    router.replace(redirect || '/')
  } catch (err: any) {
    errorMsg.value = err?.message ?? '账号或密码错误'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - var(--nav-h));
  display: flex; align-items: center; justify-content: center;
  padding: 32px 16px;
  background: linear-gradient(135deg, #f0f6ff 0%, #f8fafc 100%);
}
.auth-card {
  width: 100%; max-width: 420px;
  background: var(--white); border-radius: 16px;
  border: 1px solid var(--border); padding: 40px 36px;
  box-shadow: var(--shadow-lg);
}
.auth-header { text-align: center; margin-bottom: 28px; }
.auth-logo { font-size: 20px; font-weight: 800; color: var(--primary); display: block; margin-bottom: 20px; }
.auth-title { font-size: 22px; font-weight: 800; color: var(--text-1); margin-bottom: 6px; }
.auth-sub { font-size: 14px; color: var(--text-3); }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.forgot-link { float: right; font-weight: 400; color: var(--primary); font-size: 12px; }
.input-eye { position: relative; }
.input-eye .form-input { padding-right: 40px; }
.eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 16px; cursor: pointer; }
.auth-submit { width: 100%; padding: 13px; font-size: 16px; margin-top: 4px; }
.auth-switch { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-3); }
.auth-link { color: var(--primary); font-weight: 600; }

@media (max-width: 640px) {
  .auth-card { padding: 28px 20px; }
}
</style>
