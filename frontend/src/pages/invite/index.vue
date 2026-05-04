<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">邀请好友</h1>
      <p class="page-sub">邀请好友注册得 <strong>50</strong> 积分，好友首次下单完成再得 <strong>100</strong> 积分；好友也获 <strong>30</strong> 积分！</p>
    </div>

    <!-- 邀请码卡片 -->
    <div class="invite-card card">
      <div class="invite-code-section">
        <div class="invite-code-label">我的邀请码</div>
        <div class="invite-code">{{ inviteCode || '加载中…' }}</div>
        <button class="btn btn-primary" @click="copyLink">复制邀请链接</button>
      </div>
      <div class="invite-stats">
        <div class="stat-item">
          <div class="stat-num">{{ stats.totalInvited }}</div>
          <div class="stat-label">已邀请</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ stats.pendingFirst }}</div>
          <div class="stat-label">待首购</div>
        </div>
        <div class="stat-item success">
          <div class="stat-num">{{ stats.completedFirst }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </div>

    <!-- 邀请规则说明 -->
    <div class="rules-card card">
      <h3 class="rules-title">积分规则</h3>
      <div class="rule-item">
        <span class="rule-icon">1️⃣</span>
        <span>好友通过你的链接注册 → 你立即获得 <strong>50</strong> 积分</span>
      </div>
      <div class="rule-item">
        <span class="rule-icon">2️⃣</span>
        <span>好友完成首笔订单 → 你再得 <strong>100</strong> 积分，好友也得 <strong>30</strong> 积分</span>
      </div>
      <div class="rule-item">
        <span class="rule-icon">💡</span>
        <span>每位好友只计算首次邀请关系，不可重复绑定</span>
      </div>
    </div>

    <!-- 邀请列表 -->
    <div class="section-title">邀请记录</div>
    <div v-if="invitees.length === 0" class="empty-state">还没有邀请好友，快去分享吧！</div>
    <div class="invitee-list">
      <div v-for="u in invitees" :key="u.nickname + u.registeredAt" class="invitee-item card">
        <div class="invitee-avatar">{{ u.nickname?.charAt(0) ?? '?' }}</div>
        <div class="invitee-info">
          <div class="invitee-name">{{ u.nickname }}</div>
          <div class="invitee-time">注册于 {{ formatDate(u.registeredAt) }}</div>
        </div>
        <div class="invitee-status">
          <span v-if="u.firstOrderAt" class="badge badge-success">已首购</span>
          <span v-else class="badge badge-pending">待首购</span>
        </div>
      </div>
    </div>

    <div v-if="copied" class="toast">链接已复制！</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const inviteCode = ref('')
const inviteUrl = ref('')
const stats = ref({ totalInvited: 0, pendingFirst: 0, completedFirst: 0 })
const invitees = ref<any[]>([])
const copied = ref(false)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function copyLink() {
  navigator.clipboard.writeText(inviteUrl.value).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }).catch(() => {
    const inp = document.createElement('input')
    inp.value = inviteUrl.value
    document.body.appendChild(inp)
    inp.select()
    document.execCommand('copy')
    document.body.removeChild(inp)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}

onMounted(async () => {
  try {
    const [infoRes, inviteesRes]: any[] = await Promise.all([api.getInviteInfo(), api.getInvitees()])
    inviteCode.value = infoRes.data.inviteCode
    inviteUrl.value = infoRes.data.inviteUrl
    stats.value = {
      totalInvited: infoRes.data.totalInvited,
      pendingFirst: infoRes.data.pendingFirst,
      completedFirst: infoRes.data.completedFirst,
    }
    invitees.value = inviteesRes.data.list
  } catch {}
})
</script>

<style scoped>
.page-container { max-width: 700px; margin: 0 auto; padding: 24px 16px; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.page-sub { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }

.invite-card { padding: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; margin-bottom: 16px; }
.invite-code-section { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
.invite-code-label { font-size: 0.8rem; color: var(--text-muted); }
.invite-code { font-family: monospace; font-size: 2rem; font-weight: 700; letter-spacing: 4px; color: var(--color-primary); }

.invite-stats { display: flex; gap: 24px; }
.stat-item { text-align: center; }
.stat-num { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); }
.stat-item.success .stat-num { color: #22c55e; }
.stat-label { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

.rules-card { padding: 20px; margin-bottom: 24px; }
.rules-title { font-size: 1rem; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); }
.rule-item { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; font-size: 0.9rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); }
.rule-item:last-child { border-bottom: none; }
.rule-icon { font-size: 1rem; flex-shrink: 0; }

.section-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.invitee-list { display: flex; flex-direction: column; gap: 10px; }
.invitee-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
.invitee-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
.invitee-info { flex: 1; }
.invitee-name { font-weight: 600; color: var(--text-primary); }
.invitee-time { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
.badge { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
.badge-success { background: #dcfce7; color: #16a34a; }
.badge-pending { background: #fef3c7; color: #d97706; }

.empty-state { text-align: center; padding: 48px; color: var(--text-muted); }

.toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #1e293b; color: #fff; padding: 10px 20px; border-radius: 20px; font-size: 0.85rem; z-index: 9999; }

/* ── 暗色模式 ── */
[data-theme="dark"] .badge-success { background: rgba(82,196,26,0.12); color: #73d13d; }
[data-theme="dark"] .badge-pending { background: rgba(250,140,22,0.12); color: #ffa940; }
[data-theme="dark"] .stat-item.success .stat-num { color: #73d13d; }
[data-theme="dark"] .toast { background: #e6edf3; color: #0d1117; }
</style>
