<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <router-link to="/" class="auth-logo">⚡ JT-Hub</router-link>
        <h1 class="auth-title">创建账号</h1>
        <p class="auth-sub">注册后即可提交学业需求</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <!-- 邮箱 + 验证码 -->
        <div class="form-group">
          <label class="form-label">邮箱地址</label>
          <div class="code-row">
            <input v-model="form.email" type="email" class="form-input" placeholder="your@email.com" />
            <button type="button" class="btn btn-outline code-btn" :disabled="codeSending || codeCD > 0" @click="sendCode">
              {{ codeCD > 0 ? `${codeCD}s` : (codeSending ? '发送中' : '发验证码') }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">邮箱验证码</label>
          <input v-model="form.code" class="form-input" placeholder="6位数字验证码" maxlength="6" inputmode="numeric" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="form.username" class="form-input" placeholder="4-20位字母数字" autocomplete="username" />
          </div>
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input v-model="form.nickname" class="form-input" placeholder="显示名称" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-eye">
            <input v-model="form.password" :type="showPwd ? 'text' : 'password'" class="form-input" placeholder="至少8位，含字母+数字" autocomplete="new-password" />
            <button type="button" class="eye-btn" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁️' }}</button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input v-model="form.phone" class="form-input" placeholder="11位手机号" inputmode="numeric" />
          </div>
          <div class="form-group">
            <label class="form-label">微信号</label>
            <input v-model="form.wechatId" class="form-input" placeholder="方便联系" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">年级</label>
          <select v-model="form.grade" class="form-input form-select">
            <option value="">请选择年级</option>
            <option value="FRESHMAN">大一</option>
            <option value="SOPHOMORE">大二</option>
            <option value="JUNIOR">大三</option>
          </select>
        </div>

        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

        <button type="submit" class="btn btn-primary auth-submit" :disabled="loading">
          <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px" />
          {{ loading ? '注册中...' : '立即注册' }}
        </button>
      </form>

      <p class="auth-switch">
        已有账号？<router-link to="/login" class="auth-link">直接登录</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { api } from '../../api'

const router = useRouter()
const store = useUserStore()

const form = ref({ email: '', code: '', username: '', nickname: '', password: '', phone: '', wechatId: '', grade: '' })
const loading = ref(false)
const codeSending = ref(false)
const codeCD = ref(0)
const errorMsg = ref('')
const showPwd = ref(false)

let cdTimer: ReturnType<typeof setInterval>

async function sendCode() {
  if (!form.value.email) { errorMsg.value = '请先填写邮箱'; return }
  codeSending.value = true
  errorMsg.value = ''
  try {
    await api.sendCode(form.value.email)
    codeCD.value = 60
    cdTimer = setInterval(() => {
      codeCD.value--
      if (codeCD.value <= 0) clearInterval(cdTimer)
    }, 1000)
  } catch (err: any) {
    errorMsg.value = err?.message ?? '验证码发送失败'
  } finally {
    codeSending.value = false
  }
}

async function handleRegister() {
  errorMsg.value = ''
  const { email, code, username, nickname, password, phone, wechatId, grade } = form.value
  if (!email || !code || !username || !nickname || !password || !phone || !wechatId || !grade) {
    errorMsg.value = '请填写所有必填项'
    return
  }
  loading.value = true
  try {
    const res: any = await api.register(form.value)
    const d = res.data
    store.setAuth(d.token, { id: d.userId, username, nickname: d.nickname, email, emailVerified: true })
    router.replace('/')
  } catch (err: any) {
    errorMsg.value = err?.message ?? '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - var(--nav-h));
  display: flex; align-items: flex-start; justify-content: center;
  padding: 32px 16px;
  background: linear-gradient(135deg, #f0f6ff 0%, #f8fafc 100%);
}
.auth-card {
  width: 100%; max-width: 500px;
  background: var(--white); border-radius: 16px;
  border: 1px solid var(--border); padding: 40px 36px;
  box-shadow: var(--shadow-lg);
}
.auth-header { text-align: center; margin-bottom: 28px; }
.auth-logo { font-size: 20px; font-weight: 800; color: var(--primary); display: block; margin-bottom: 20px; }
.auth-title { font-size: 22px; font-weight: 800; color: var(--text-1); margin-bottom: 6px; }
.auth-sub { font-size: 14px; color: var(--text-3); }
.auth-form { display: flex; flex-direction: column; gap: 14px; }
.code-row { display: flex; gap: 8px; }
.code-row .form-input { flex: 1; }
.code-btn { flex-shrink: 0; white-space: nowrap; padding: 10px 14px; font-size: 13px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-select { appearance: auto; }
.input-eye { position: relative; }
.input-eye .form-input { padding-right: 40px; }
.eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 16px; cursor: pointer; }
.auth-submit { width: 100%; padding: 13px; font-size: 16px; margin-top: 4px; }
.auth-switch { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-3); }
.auth-link { color: var(--primary); font-weight: 600; }

@media (max-width: 640px) {
  .auth-card { padding: 24px 16px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
