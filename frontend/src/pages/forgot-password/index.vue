<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <router-link to="/" class="auth-logo">JT-Hub</router-link>
        <h1 class="auth-title">{{ step === 1 ? '找回密码' : '重置密码' }}</h1>
        <p class="auth-sub">{{ step === 1 ? '输入注册邮箱，我们将发送验证码' : '输入验证码和新密码' }}</p>
      </div>

      <!-- Step 1: 输入邮箱 -->
      <form v-if="step === 1" @submit.prevent="sendCode" class="auth-form">
        <div class="form-group">
          <label class="form-label">注册邮箱</label>
          <input v-model="email" type="email" class="form-input" placeholder="your@email.com" />
        </div>
        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
        <div v-if="successMsg" class="form-success">{{ successMsg }}</div>
        <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
          <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px" />
          {{ loading ? '发送中...' : '发送验证码' }}
        </button>
      </form>

      <!-- Step 2: 输入验证码和新密码 -->
      <form v-else @submit.prevent="resetPassword" class="auth-form">
        <div class="form-group">
          <label class="form-label">邮箱验证码</label>
          <div class="code-row">
            <input v-model="code" class="form-input" placeholder="6位数字验证码" maxlength="6" inputmode="numeric" />
            <button type="button" class="btn btn-outline code-btn" :disabled="codeCD > 0" @click="sendCode">
              {{ codeCD > 0 ? `${codeCD}s` : '重新发送' }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">新密码</label>
          <div class="input-eye">
            <input v-model="newPassword" :type="showPwd ? 'text' : 'password'" class="form-input" placeholder="至少8位，含字母+数字" autocomplete="new-password" />
            <button type="button" class="eye-btn" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</button>
          </div>
        </div>
        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
        <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
          <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px" />
          {{ loading ? '重置中...' : '重置密码' }}
        </button>
      </form>

      <p class="auth-switch">
        <router-link to="/login" class="auth-link">← 返回登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../api'

const router = useRouter()
const step = ref(1)
const email = ref('')
const code = ref('')
const newPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const showPwd = ref(false)
const codeCD = ref(0)
let cdTimer: ReturnType<typeof setInterval>

async function sendCode() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!email.value) { errorMsg.value = '请填写邮箱'; return }
  loading.value = true
  try {
    await api.forgotPassword(email.value)
    successMsg.value = '验证码已发送到您的邮箱'
    if (step.value === 1) step.value = 2
    codeCD.value = 60
    cdTimer = setInterval(() => {
      codeCD.value--
      if (codeCD.value <= 0) clearInterval(cdTimer)
    }, 1000)
  } catch (err: any) {
    errorMsg.value = err?.message ?? '发送失败'
  } finally { loading.value = false }
}

async function resetPassword() {
  errorMsg.value = ''
  if (!code.value || code.value.length !== 6) { errorMsg.value = '请输入6位验证码'; return }
  if (!newPassword.value || newPassword.value.length < 8) { errorMsg.value = '密码至少8位'; return }
  loading.value = true
  try {
    await api.resetPassword(email.value, code.value, newPassword.value)
    alert('密码重置成功，请使用新密码登录')
    router.replace('/login')
  } catch (err: any) {
    errorMsg.value = err?.message ?? '重置失败'
  } finally { loading.value = false }
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
.auth-submit { width: 100%; padding: 13px; font-size: 16px; margin-top: 4px; }
.auth-switch { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-3); }
.auth-link { color: var(--primary); font-weight: 600; }
.form-error { font-size: 12px; color: var(--danger); }
.form-success { font-size: 13px; color: var(--success); background: #f6ffed; padding: 8px 12px; border-radius: 6px; }
.code-row { display: flex; gap: 8px; }
.code-row .form-input { flex: 1; }
.code-btn { flex-shrink: 0; white-space: nowrap; padding: 10px 14px; font-size: 13px; }
.input-eye { position: relative; }
.input-eye .form-input { padding-right: 40px; }
.eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 16px; cursor: pointer; }

@media (max-width: 640px) {
  .auth-card { padding: 28px 20px; }
}
</style>
