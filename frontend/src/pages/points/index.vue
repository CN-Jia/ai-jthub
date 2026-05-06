<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">我的积分</h1>
      <router-link to="/points/shop" class="btn btn-primary">积分商城</router-link>
    </div>

    <!-- 余额卡片 -->
    <div class="balance-cards">
      <div class="balance-card available">
        <div class="balance-label">可用积分</div>
        <div class="balance-value">{{ balance.totalPoints.toLocaleString() }}</div>
      </div>
      <div class="balance-card frozen">
        <div class="balance-label">冻结中</div>
        <div class="balance-value">{{ balance.frozenPoints.toLocaleString() }}</div>
      </div>
      <div class="balance-card lifetime">
        <div class="balance-label">累计获得</div>
        <div class="balance-value">{{ balance.lifetimeEarned.toLocaleString() }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      <button :class="['tab-btn', tab === 'logs' && 'active']" @click="tab = 'logs'">积分明细</button>
      <button :class="['tab-btn', tab === 'redeem' && 'active']" @click="tab = 'redeem'; loadRedeems()">兑换记录</button>
      <button :class="['tab-btn', tab === 'coupons' && 'active']" @click="tab = 'coupons'; loadCoupons()">我的优惠券</button>
    </div>

    <!-- 积分明细 -->
    <div v-if="tab === 'logs'">
      <div v-if="logs.length === 0 && !logsLoading" class="empty-state">暂无积分记录</div>
      <div class="log-list">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <div class="log-left">
            <span class="log-event-badge" :class="eventClass(log.eventType)">{{ eventLabel(log.eventType) }}</span>
            <span class="log-remark">{{ log.remark || '' }}</span>
          </div>
          <div class="log-right">
            <span class="log-delta" :class="log.delta > 0 ? 'positive' : 'negative'">
              {{ log.delta > 0 ? '+' : '' }}{{ log.delta }}
            </span>
            <span class="log-time">{{ formatDate(log.createdAt) }}</span>
          </div>
        </div>
      </div>
      <div v-if="logsTotal > logs.length" class="load-more">
        <button class="btn btn-secondary" @click="loadMoreLogs" :disabled="logsLoading">加载更多</button>
      </div>
    </div>

    <!-- 兑换记录 -->
    <div v-if="tab === 'redeem'">
      <div v-if="redeems.length === 0" class="empty-state">暂无兑换记录</div>
      <div class="redeem-list">
        <div v-for="r in redeems" :key="r.id" class="redeem-item card">
          <div class="redeem-header">
            <span class="redeem-name">{{ r.shopItem.name }}</span>
            <span class="redeem-status" :class="redeemStatusClass(r.status)">{{ redeemStatusLabel(r.status) }}</span>
          </div>
          <div class="redeem-meta">
            <span>消耗 {{ r.pointsCost }} 积分</span>
            <span>{{ formatDate(r.createdAt) }}</span>
          </div>
          <div v-if="r.adminNote" class="redeem-note">备注：{{ r.adminNote }}</div>
          <div v-if="r.coupon" class="coupon-chip">
            优惠券：<strong>{{ r.coupon.code }}</strong>
            <span v-if="r.coupon.discountAmt"> · 面值 ¥{{ r.coupon.discountAmt }}</span>
            · 有效期至 {{ formatDate(r.coupon.expiresAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 优惠券 -->
    <div v-if="tab === 'coupons'">
      <div v-if="coupons.length === 0" class="empty-state">暂无可用优惠券</div>
      <div class="coupon-list">
        <div v-for="c in coupons" :key="c.id" class="coupon-card">
          <div class="coupon-amount">¥{{ c.discountAmt }}</div>
          <div class="coupon-info">
            <div class="coupon-code">{{ c.code }}</div>
            <div class="coupon-expire">有效期至 {{ formatDate(c.expiresAt) }}</div>
          </div>
          <div class="coupon-status">可用</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const balance = ref({ totalPoints: 0, frozenPoints: 0, lifetimeEarned: 0 })
const logs = ref<any[]>([])
const logsTotal = ref(0)
const logsPage = ref(1)
const logsLoading = ref(false)
const redeems = ref<any[]>([])
const coupons = ref<any[]>([])
const tab = ref<'logs' | 'redeem' | 'coupons'>('logs')

const EVENT_LABELS: Record<string, string> = {
  INVITE_REGISTER: '邀请注册',
  INVITE_FIRST_ORDER: '拉新首购',
  NEW_USER_FIRST_ORDER: '首购奖励',
  ADMIN_ADJUST: '管理调整',
  REDEEM_FREEZE: '兑换冻结',
  REDEEM_DEDUCT: '兑换扣减',
  REDEEM_UNFREEZE: '解冻归还',
}

function eventLabel(type: string) { return EVENT_LABELS[type] ?? type }
function eventClass(type: string) {
  if (['INVITE_REGISTER', 'INVITE_FIRST_ORDER', 'NEW_USER_FIRST_ORDER'].includes(type)) return 'badge-green'
  if (type === 'ADMIN_ADJUST') return 'badge-blue'
  return 'badge-gray'
}
function redeemStatusLabel(s: string) {
  return { PENDING: '待审核', COMPLETED: '已完成', REJECTED: '已拒绝' }[s] ?? s
}
function redeemStatusClass(s: string) {
  return { PENDING: 'status-pending', COMPLETED: 'status-success', REJECTED: 'status-danger' }[s] ?? ''
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadBalance() {
  const res: any = await api.getPointBalance()
  balance.value = res.data
}

async function loadLogs() {
  logsLoading.value = true
  try {
    const res: any = await api.getPointLogs({ page: 1, pageSize: 20 })
    logs.value = res.data.list
    logsTotal.value = res.data.total
    logsPage.value = 1
  } finally {
    logsLoading.value = false
  }
}

async function loadMoreLogs() {
  logsLoading.value = true
  try {
    const res: any = await api.getPointLogs({ page: logsPage.value + 1, pageSize: 20 })
    logs.value.push(...res.data.list)
    logsPage.value++
  } finally {
    logsLoading.value = false
  }
}

async function loadRedeems() {
  const res: any = await api.getMyRedeems()
  redeems.value = res.data.list
}

async function loadCoupons() {
  const res: any = await api.getMyCoupons()
  coupons.value = res.data.list
}

onMounted(() => {
  loadBalance()
  loadLogs()
  loadCoupons()
})
</script>

<style scoped>
.page-container { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }

.balance-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.balance-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; text-align: center; }
.balance-card.available { border-color: var(--color-primary); background: linear-gradient(135deg, var(--color-primary) 0%, #5b8cff 100%); color: #fff; }
.balance-card.available .balance-label, .balance-card.available .balance-value { color: #fff; }
.balance-label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; }
.balance-value { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); }

.tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; }
.tab-btn { padding: 8px 16px; border: none; background: none; cursor: pointer; color: var(--text-muted); font-size: 0.9rem; border-bottom: 2px solid transparent; transition: all .2s; }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

.log-list { display: flex; flex-direction: column; gap: 10px; }
.log-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; }
.log-left { display: flex; flex-direction: column; gap: 4px; }
.log-right { text-align: right; }
.log-remark { font-size: 0.8rem; color: var(--text-muted); }
.log-delta { font-size: 1.1rem; font-weight: 700; }
.log-delta.positive { color: #22c55e; }
.log-delta.negative { color: #ef4444; }
.log-time { font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px; }

.badge-green { background: #dcfce7; color: #16a34a; }
.badge-blue { background: #dbeafe; color: #2563eb; }
.badge-gray { background: var(--bg-secondary); color: var(--text-muted); }
.log-event-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }

.load-more { text-align: center; margin-top: 16px; }

.redeem-list { display: flex; flex-direction: column; gap: 12px; }
.redeem-item { padding: 16px; }
.redeem-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.redeem-name { font-weight: 600; color: var(--text-primary); }
.redeem-meta { font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 16px; }
.redeem-note { margin-top: 8px; font-size: 0.8rem; color: var(--text-muted); }
.coupon-chip { margin-top: 8px; padding: 6px 10px; background: #fef9c3; border-radius: 6px; font-size: 0.8rem; color: #92400e; }

.status-pending { background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
.status-success { background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }
.status-danger { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; }

.coupon-list { display: flex; flex-direction: column; gap: 12px; }
.coupon-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: linear-gradient(135deg, #fff7ed, #fffbeb); border: 1px dashed #f59e0b; border-radius: 12px; }
.coupon-amount { font-size: 2rem; font-weight: 700; color: #d97706; min-width: 80px; text-align: center; }
.coupon-info { flex: 1; }
.coupon-code { font-family: monospace; font-size: 1rem; font-weight: 700; letter-spacing: 2px; color: var(--text-primary); }
.coupon-expire { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
.coupon-status { padding: 4px 12px; background: #22c55e; color: #fff; border-radius: 20px; font-size: 0.75rem; }

.empty-state { text-align: center; padding: 48px 0; color: var(--text-muted); }
@media (max-width: 600px) {
  .balance-cards { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .balance-value { font-size: 1.2rem; }
}

/* ── 暗色模式 ── */
[data-theme="dark"] .badge-green { background: rgba(82,196,26,0.12); color: #73d13d; }
[data-theme="dark"] .badge-blue { background: rgba(22,119,255,0.12); color: #3b9eff; }
[data-theme="dark"] .coupon-chip { background: rgba(234,179,8,0.1); color: #fbbf24; }
[data-theme="dark"] .status-pending { background: rgba(250,140,22,0.12); color: #ffa940; }
[data-theme="dark"] .status-success { background: rgba(82,196,26,0.12); color: #73d13d; }
[data-theme="dark"] .status-danger { background: rgba(255,77,79,0.12); color: #ff7875; }
[data-theme="dark"] .coupon-card { background: linear-gradient(135deg, rgba(234,179,8,0.06), rgba(250,140,22,0.04)); border-color: rgba(245,158,11,0.3); }
[data-theme="dark"] .log-delta.positive { color: #73d13d; }
[data-theme="dark"] .log-delta.negative { color: #ff7875; }
</style>
