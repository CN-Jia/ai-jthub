<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">我的订单</h1>
      <div class="filter-tabs">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="tab"
          :class="{ active: activeTab === t.value }"
          @click="switchTab(t.value)"
        >{{ t.label }}</button>
      </div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <div class="spinner" />
    </div>

    <div v-else-if="orders.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-title">暂无订单</div>
      <div class="empty-sub">还没有购买记录，去看看我们的服务吧</div>
      <router-link to="/products" class="btn-start">立即选购</router-link>
    </div>

    <div v-else class="orders-list">
      <div
        v-for="o in orders"
        :key="o.id"
        class="order-card"
        @click="$router.push(`/orders/${o.id}`)"
      >
        <div class="order-top">
          <div class="order-info">
            <div class="order-no">{{ o.orderNo }}</div>
            <div class="order-product">{{ o.product?.name }}</div>
          </div>
          <span class="status-tag" :class="`status-${o.status}`">{{ statusLabel(o.status) }}</span>
        </div>
        <div class="order-bottom">
          <span class="order-price">¥{{ Number(o.paidPrice).toFixed(2) }}</span>
          <span class="order-date">{{ fmtDate(o.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <button :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="changePage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const tabs = [
  { value: '', label: '全部' },
  { value: 'CREATED', label: '待支付' },
  { value: 'PAID', label: '已支付' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
]

const loading = ref(true)
const orders = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const activeTab = ref('')

function statusLabel(s: string) {
  const m: Record<string, string> = { CREATED: '待支付', PAID: '已支付', COMPLETED: '已完成', CANCELLED: '已取消' }
  return m[s] ?? s
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadOrders() {
  loading.value = true
  try {
    const res: any = await api.getMyProductOrders({ page: page.value, pageSize, status: activeTab.value || undefined })
    orders.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function switchTab(v: string) {
  activeTab.value = v
  page.value = 1
  loadOrders()
}

function changePage(p: number) {
  page.value = p
  loadOrders()
}

onMounted(loadOrders)
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 800; color: var(--text-1); }
.filter-tabs { display: flex; gap: 6px; }
.tab { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-size: 13px; color: var(--text-2); transition: all 0.15s; }
.tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }

.loading-wrap { display: flex; justify-content: center; padding: 60px; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 40px; margin-bottom: 14px; }
.empty-title { font-size: 16px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.empty-sub { font-size: 14px; color: var(--text-3); margin-bottom: 20px; }
.btn-start { display: inline-block; padding: 10px 24px; border-radius: 8px; background: var(--primary); color: #fff; font-size: 14px; font-weight: 600; }

.orders-list { display: flex; flex-direction: column; gap: 12px; }
.order-card {
  background: var(--card-bg, #fff); border: 1px solid var(--border); border-radius: 12px;
  padding: 16px 20px; cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.order-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-color: var(--primary); }
.order-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.order-no { font-size: 12px; color: var(--text-3); font-family: monospace; margin-bottom: 4px; }
.order-product { font-size: 15px; font-weight: 600; color: var(--text-1); }
.order-bottom { display: flex; justify-content: space-between; align-items: center; }
.order-price { font-size: 16px; font-weight: 700; color: var(--primary); }
.order-date { font-size: 12px; color: var(--text-3); }

.status-tag { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.status-CREATED { background: #fef9c3; color: #854d0e; }
.status-PAID { background: #dbeafe; color: #1d4ed8; }
.status-COMPLETED { background: #dcfce7; color: #166534; }
.status-CANCELLED { background: #f1f5f9; color: #64748b; }

.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; }
.pagination button { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-size: 13px; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
