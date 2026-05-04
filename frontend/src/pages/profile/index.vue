<template>
  <div class="page-container">
    <h1 class="page-title">个人中心</h1>

    <div class="profile-layout">
      <!-- 基本信息 -->
      <div class="card profile-card">
        <div class="avatar-row">
          <div class="avatar">{{ avatarChar }}</div>
          <div>
            <div class="profile-name">{{ info.nickname }}</div>
            <div class="profile-username">@{{ info.username }}</div>
          </div>
        </div>
        <hr class="divider" />
        <form @submit.prevent="saveProfile" class="form">
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input v-model="form.nickname" class="form-input" placeholder="显示名称" />
          </div>
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input v-model="form.phone" class="form-input" placeholder="11位手机号" />
          </div>
          <div class="form-group">
            <label class="form-label">微信号</label>
            <input v-model="form.wechatId" class="form-input" placeholder="联系微信" />
          </div>
          <div class="form-group">
            <label class="form-label">年级</label>
            <select v-model="form.grade" class="form-input">
              <option value="">不设置</option>
              <option value="FRESHMAN">大一</option>
              <option value="SOPHOMORE">大二</option>
              <option value="JUNIOR">大三</option>
            </select>
          </div>
          <div v-if="profileMsg" class="feedback-msg" :class="profileMsgType">{{ profileMsg }}</div>
          <button type="submit" class="btn btn-primary" :disabled="profileSaving">{{ profileSaving ? '保存中...' : '保存修改' }}</button>
        </form>
      </div>

      <!-- 右侧：只读信息 + 改密码 -->
      <div class="side-col">
        <!-- 账号信息 -->
        <div class="card">
          <h3 class="section-title">账号信息</h3>
          <div class="info-row"><span class="info-label">邮箱</span><span>{{ info.email }}</span></div>
          <div class="info-row">
            <span class="info-label">邮箱验证</span>
            <span class="badge" :class="info.emailVerified ? 'badge-green' : 'badge-orange'">{{ info.emailVerified ? '已验证' : '未验证' }}</span>
          </div>
          <div v-if="!info.emailVerified" class="verify-section">
            <div v-if="verifyMsg" class="feedback-msg" :class="verifyMsgType">{{ verifyMsg }}</div>
            <div v-if="showVerifyCode" class="verify-code-row">
              <input v-model="verifyCode" class="form-input" placeholder="6位验证码" maxlength="6" inputmode="numeric" />
              <button class="btn btn-primary btn-sm" :disabled="verifySubmitting" @click="doVerifyCode">
                {{ verifySubmitting ? '验证中...' : '验证' }}
              </button>
            </div>
            <button class="btn btn-outline btn-sm" style="margin-top:8px;width:100%" :disabled="verifyCD > 0" @click="sendVerifyCode">
              {{ verifyCD > 0 ? `${verifyCD}s 后可重新发送` : '发送验证邮件' }}
            </button>
          </div>
          <div class="info-row"><span class="info-label">用户名</span><span>@{{ info.username }}</span></div>
        </div>

        <!-- 修改密码 -->
        <div class="card">
          <h3 class="section-title">修改密码</h3>
          <form @submit.prevent="changePwd" class="form">
            <div class="form-group">
              <label class="form-label">旧密码</label>
              <input v-model="pwdForm.old" type="password" class="form-input" placeholder="当前密码" autocomplete="current-password" />
            </div>
            <div class="form-group">
              <label class="form-label">新密码</label>
              <input v-model="pwdForm.new" type="password" class="form-input" placeholder="至少8位含字母和数字" autocomplete="new-password" />
            </div>
            <div v-if="pwdMsg" class="feedback-msg" :class="pwdMsgType">{{ pwdMsg }}</div>
            <button type="submit" class="btn btn-outline" :disabled="pwdSaving">{{ pwdSaving ? '提交中...' : '修改密码' }}</button>
          </form>
        </div>

        <!-- 快捷链接 -->
        <div class="card quick-links">
          <router-link to="/orders" class="quick-link">📋 我的订单</router-link>
          <router-link to="/forum" class="quick-link">📝 论坛社区</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/user'
import { api } from '../../api'

const store = useUserStore()
const info = computed(() => store.userInfo ?? { nickname: '', username: '', email: '', emailVerified: false })
const avatarChar = computed(() => info.value.nickname ? info.value.nickname[0] : 'U')

const form = ref({ nickname: '', phone: '', wechatId: '', grade: '' })
const profileSaving = ref(false)
const profileMsg = ref('')
const profileMsgType = ref('success')

const pwdForm = ref({ old: '', new: '' })
const pwdSaving = ref(false)
const pwdMsg = ref('')
const pwdMsgType = ref('success')

const verifyCode = ref('')
const verifyCD = ref(0)
const verifyMsg = ref('')
const verifyMsgType = ref('success')
const showVerifyCode = ref(false)
const verifySubmitting = ref(false)
let cdTimer: ReturnType<typeof setInterval>

onMounted(async () => {
  try {
    const res: any = await api.getMe()
    store.setUserInfo(res.data)
    const d = res.data
    form.value = { nickname: d.nickname, phone: d.phone ?? '', wechatId: d.wechatId ?? '', grade: d.grade ?? '' }
  } catch { /* ignore */ }
})

async function saveProfile() {
  profileMsg.value = ''
  profileSaving.value = true
  try {
    const res: any = await api.updateProfile(form.value)
    store.setUserInfo({ ...store.userInfo!, ...res.data })
    profileMsg.value = '保存成功'
    profileMsgType.value = 'success'
  } catch (err: any) {
    profileMsg.value = err?.message ?? '保存失败'
    profileMsgType.value = 'error'
  } finally { profileSaving.value = false }
}

async function changePwd() {
  pwdMsg.value = ''
  if (!pwdForm.value.old || !pwdForm.value.new) { pwdMsg.value = '请填写完整'; pwdMsgType.value = 'error'; return }
  pwdSaving.value = true
  try {
    await api.changePassword(pwdForm.value.old, pwdForm.value.new)
    pwdMsg.value = '密码修改成功，下次登录使用新密码'
    pwdMsgType.value = 'success'
    pwdForm.value = { old: '', new: '' }
  } catch (err: any) {
    pwdMsg.value = err?.message ?? '修改失败'
    pwdMsgType.value = 'error'
  } finally { pwdSaving.value = false }
}

async function sendVerifyCode() {
  verifyMsg.value = ''
  try {
    await api.resendVerification()
    showVerifyCode.value = true
    verifyMsg.value = '验证码已发送到您的邮箱'
    verifyMsgType.value = 'success'
    verifyCD.value = 60
    cdTimer = setInterval(() => {
      verifyCD.value--
      if (verifyCD.value <= 0) clearInterval(cdTimer)
    }, 1000)
  } catch (err: any) {
    verifyMsg.value = err?.message ?? '发送失败'
    verifyMsgType.value = 'error'
  }
}

async function doVerifyCode() {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    verifyMsg.value = '请输入6位验证码'
    verifyMsgType.value = 'error'
    return
  }
  verifySubmitting.value = true
  verifyMsg.value = ''
  try {
    await api.verifyEmail(verifyCode.value)
    verifyMsg.value = '邮箱验证成功'
    verifyMsgType.value = 'success'
    showVerifyCode.value = false
    verifyCode.value = ''
    // 更新 store 中的用户信息
    const res: any = await api.getMe()
    store.setUserInfo(res.data)
  } catch (err: any) {
    verifyMsg.value = err?.message ?? '验证失败'
    verifyMsgType.value = 'error'
  } finally { verifySubmitting.value = false }
}
</script>

<style scoped>
.page-title { font-size: 24px; font-weight: 800; margin-bottom: 24px; }
.profile-layout { display: grid; grid-template-columns: 1fr 360px; gap: 20px; align-items: flex-start; }
.section-title { font-size: 14px; font-weight: 700; color: var(--text-2); margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.05em; }
.avatar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 24px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.profile-name { font-size: 18px; font-weight: 700; color: var(--text-1); }
.profile-username { font-size: 13px; color: var(--text-3); }
.form { display: flex; flex-direction: column; gap: 14px; }
.info-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--text-2); }
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--text-3); font-size: 13px; }
.side-col { display: flex; flex-direction: column; gap: 16px; }
.quick-links { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
.quick-link { display: block; padding: 12px 20px; font-size: 14px; color: var(--text-2); border-bottom: 1px solid var(--border); transition: color 0.15s, background 0.15s; }
.quick-link:last-child { border-bottom: none; }
.quick-link:hover { color: var(--primary); background: var(--primary-light); }
.feedback-msg { font-size: 13px; padding: 8px 12px; border-radius: 6px; }
.feedback-msg.success { background: #f6ffed; color: var(--success); }
.feedback-msg.error { background: #fff1f0; color: var(--danger); }
.verify-section { padding-top: 8px; }
.verify-code-row { display: flex; gap: 8px; margin-top: 8px; }
.verify-code-row .form-input { flex: 1; }
.btn-sm { padding: 7px 14px; font-size: 13px; }

@media (max-width: 768px) {
  .profile-layout { grid-template-columns: 1fr; }
}

/* ── 暗色模式 ── */
[data-theme="dark"] .feedback-msg.success { background: rgba(82,196,26,0.12); color: #73d13d; }
[data-theme="dark"] .feedback-msg.error { background: rgba(255,77,79,0.12); color: #ff7875; }
</style>
