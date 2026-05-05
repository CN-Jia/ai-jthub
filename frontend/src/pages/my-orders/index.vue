<template>
  <div class="orders-page">
    <div class="orders-inner">
      <div class="page-head">
        <h1 class="page-title">我的订单</h1>
        <router-link to="/submit" class="btn-new">+ 提交新需求</router-link>
      </div>

      <div v-if="loading" class="skeleton-list">
        <div class="skeleton-order" v-for="i in 3" :key="i"></div>
      </div>
      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">暂无订单</div>
        <div class="empty-desc">提交您的第一个需求</div>
        <router-link to="/submit" class="empty-btn">去提交需求</router-link>
      </div>
      <div v-else class="order-list">
        <router-link
          v-for="o in orders"
          :key="o.id"
          :to="`/my-orders/${o.id}`"
          class="order-card"
        >
          <div class="card-left">
            <div class="order-status-bar" :class="o.status"></div>
            <div class="order-main">
              <div class="order-course">{{ o.courseName }}</div>
              <div class="order-meta">
                <span class="meta-type">{{ o.orderType?.name }}</span>
                <span class="meta-sep">·</span>
                <span>截止 {{ fmtDate(o.deadline) }}</span>
              </div>
              <div class="order-no">{{ o.orderNo }}</div>
            </div>
          </div>
          <div class="card-right">
            <div v-if="o.quotedPrice" class="order-price">{{ o.quotedPrice }}</div>
            <span class="order-status-badge" :class="o.status">{{ statusLabel(o.status) }}</span>
            <span class="card-arrow">›</span>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const orders = ref<any[]>([])
const loading = ref(true)
const statusLabels: Record<string,string> = { CREATED:'已创建', PENDING:'待处理', ACCEPTED:'已接单', IN_PROGRESS:'进行中', COMPLETED:'已完成', CLOSED:'已关闭', CANCELLED:'已取消' }
const statusLabel = (s: string) => statusLabels[s] ?? s
const fmtDate = (d: string) => new Date(d).toLocaleDateString('zh-CN')

onMounted(async () => {
  try { const res: any = await api.getMyOrders(); orders.value = res.data?.list ?? [] }
  finally { loading.value = false }
})
</script>

<style scoped>
.orders-page { padding: 48px 32px 80px; background: var(--bg); min-height: calc(100vh - 64px); }
.orders-inner { max-width: 800px; margin: 0 auto; }
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 26px; font-weight: 800; color: var(--text-1); }
.btn-new { background: var(--primary); color: #fff; border-radius: 9px; padding: 9px 20px; font-size: 14px; font-weight: 600; transition: background 0.15s; }
.btn-new:hover { background: var(--primary-dark); }

.skeleton-list { display: flex; flex-direction: column; gap: 12px; }
.skeleton-order { height: 88px; border-radius: var(--radius); background: linear-gradient(90deg, #f0f2f5 25%, #e8edf2 50%, #f0f2f5 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }

.empty-state { text-align: center; padding: 80px 0; }
.empty-icon { font-size: 56px; margin-bottom: 16px; }
.empty-title { font-size: 20px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.empty-desc { font-size: 14px; color: var(--text-3); margin-bottom: 24px; }
.empty-btn { display: inline-block; background: var(--primary); color: #fff; border-radius: 9px; padding: 11px 24px; font-size: 14px; font-weight: 600; }

.order-list { display: flex; flex-direction: column; gap: 12px; }
.order-card {
  background: var(--card); border-radius: var(--radius-lg);
  display: flex; align-items: center; justify-content: space-between;
  overflow: hidden; box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, transform 0.2s;
}
.order-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.card-left { display: flex; align-items: stretch; flex: 1; min-width: 0; }
.order-status-bar { width: 4px; flex-shrink: 0; }
.PENDING .order-status-bar  { background: #fa8c16; }
.ACCEPTED .order-status-bar { background: var(--primary); }
.IN_PROGRESS .order-status-bar { background: #13c2c2; }
.COMPLETED .order-status-bar { background: var(--success); }
.CLOSED .order-status-bar    { background: #d0d7de; }
.order-main { padding: 20px 20px 20px 20px; flex: 1; min-width: 0; }
.order-course { font-size: 17px; font-weight: 700; color: var(--text-1); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.order-meta { display: flex; gap: 8px; font-size: 13px; color: var(--text-3); margin-bottom: 6px; flex-wrap: wrap; }
.meta-type { background: #f0f2f5; padding: 2px 8px; border-radius: 5px; color: var(--text-2); }
.meta-sep { color: var(--border); }
.order-no { font-size: 12px; color: #d0d7de; font-family: monospace; }
.card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; padding: 20px 20px; flex-shrink: 0; }
.order-price { font-size: 15px; font-weight: 800; color: var(--primary); }
.order-status-badge { font-size: 12px; padding: 4px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
.PENDING .order-status-badge  { background: #fff7e6; color: #d46b08; }
.ACCEPTED .order-status-badge { background: var(--primary-light); color: var(--primary); }
.IN_PROGRESS .order-status-badge { background: #e6fffb; color: #08979c; }
.COMPLETED .order-status-badge { background: #f6ffed; color: #389e0d; }
.CLOSED .order-status-badge    { background: #f5f5f5; color: #8c8c8c; }
.card-arrow { font-size: 20px; color: #d0d7de; }

/* ── 暗色模式 ── */
[data-theme="dark"] .order-card { background: var(--card-bg); }
[data-theme="dark"] .PENDING .order-status-badge  { background: rgba(250,140,22,0.12); color: #ffa940; }
[data-theme="dark"] .ACCEPTED .order-status-badge { background: rgba(59,158,255,0.12); color: #3b9eff; }
[data-theme="dark"] .IN_PROGRESS .order-status-badge { background: rgba(19,194,194,0.12); color: #36cfc9; }
[data-theme="dark"] .COMPLETED .order-status-badge { background: rgba(82,196,26,0.12); color: #73d13d; }
[data-theme="dark"] .CLOSED .order-status-badge    { background: rgba(255,255,255,0.06); color: #8b949e; }
[data-theme="dark"] .PENDING .order-status-bar  { background: #ffa940; }
[data-theme="dark"] .IN_PROGRESS .order-status-bar { background: #36cfc9; }
[data-theme="dark"] .CLOSED .order-status-bar    { background: #30363d; }
</style>
