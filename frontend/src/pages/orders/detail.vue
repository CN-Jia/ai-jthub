<template>
  <div class="page-container detail-wrap">
    <div v-if="loading" class="loading-wrap"><div class="spinner" /></div>

    <template v-else-if="order">
      <div class="back-btn" @click="$router.push('/orders')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        返回订单列表
      </div>

      <div class="order-card card">
        <!-- 头部 -->
        <div class="order-head">
          <div>
            <div class="order-no">{{ order.orderNo }}</div>
            <div class="order-product-name">{{ order.product?.name }}</div>
          </div>
          <span class="status-tag" :class="`status-${order.status}`">{{ statusLabel(order.status) }}</span>
        </div>

        <!-- 提示横幅 -->
        <div v-if="order.status === 'PAID'" class="info-banner info">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
          已收到您的支付信息，请等待管理员核对，核对完成后将更新订单状态
        </div>
        <div v-if="order.status === 'COMPLETED'" class="info-banner success">
          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
          订单已完成！感谢您的信任
        </div>
        <div v-if="order.status === 'CANCELLED'" class="info-banner danger">
          订单已取消{{ order.cancelReason ? `：${order.cancelReason}` : '' }}
        </div>

        <!-- 金额信息 -->
        <div class="info-section">
          <h4 class="section-label">支付信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-key">原价</span>
              <span>¥{{ Number(order.originalPrice).toFixed(2) }}</span>
            </div>
            <div v-if="Number(order.discountAmount) > 0" class="info-item">
              <span class="info-key">优惠</span>
              <span style="color:#10b981">-¥{{ Number(order.discountAmount).toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <span class="info-key">实付金额</span>
              <span class="paid-price">¥{{ Number(order.paidPrice).toFixed(2) }}</span>
            </div>
            <div v-if="order.coupon" class="info-item">
              <span class="info-key">优惠码</span>
              <span>{{ order.coupon.code }}</span>
            </div>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="info-section">
          <h4 class="section-label">订单信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-key">创建时间</span>
              <span>{{ fmtDate(order.createdAt) }}</span>
            </div>
            <div v-if="order.paidAt" class="info-item">
              <span class="info-key">支付时间</span>
              <span>{{ fmtDate(order.paidAt) }}</span>
            </div>
            <div v-if="order.completedAt" class="info-item">
              <span class="info-key">完成时间</span>
              <span>{{ fmtDate(order.completedAt) }}</span>
            </div>
            <div v-if="order.userNote" class="info-item">
              <span class="info-key">备注</span>
              <span>{{ order.userNote }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="order-actions">
          <button
            v-if="order.status === 'CREATED'"
            class="btn-primary"
            @click="openPayment"
          >去支付</button>
          <button
            v-if="order.status === 'CREATED'"
            class="btn-cancel"
            :disabled="cancelling"
            @click="handleCancel"
          >{{ cancelling ? '取消中...' : '取消订单' }}</button>
        </div>
      </div>
    </template>

    <div v-else class="not-found">订单不存在</div>

    <PaymentModal
      v-if="showPayment && order"
      :order="order"
      @paid="handlePaid"
      @close="showPayment = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../api'
import PaymentModal from '../../components/PaymentModal.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const order = ref<any>(null)
const showPayment = ref(false)
const cancelling = ref(false)

function statusLabel(s: string) {
  const m: Record<string, string> = { CREATED: '待支付', PAID: '已支付', COMPLETED: '已完成', CANCELLED: '已取消' }
  return m[s] ?? s
}
function fmtDate(d: string) {
  return new Date(d).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })
}

async function loadOrder() {
  loading.value = true
  try {
    const res: any = await api.getProductOrder(route.params.id as string)
    order.value = res.data
  } finally {
    loading.value = false
  }
}

function openPayment() { showPayment.value = true }

function handlePaid() {
  showPayment.value = false
  loadOrder()
}

async function handleCancel() {
  if (!confirm('确定要取消这个订单吗？')) return
  cancelling.value = true
  try {
    await api.cancelProductOrder(order.value.id)
    await loadOrder()
  } finally {
    cancelling.value = false
  }
}

onMounted(loadOrder)
</script>

<style scoped>
.detail-wrap { max-width: 680px; margin: 0 auto; }
.loading-wrap { display: flex; justify-content: center; padding: 60px; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }

.back-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-3); cursor: pointer; margin-bottom: 20px; }
.back-btn:hover { color: var(--primary); }

.order-card { padding: 24px; }
.order-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.order-no { font-size: 12px; color: var(--text-3); font-family: monospace; margin-bottom: 4px; }
.order-product-name { font-size: 18px; font-weight: 700; color: var(--text-1); }

.status-tag { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.status-CREATED { background: #fef9c3; color: #854d0e; }
.status-PAID { background: #dbeafe; color: #1d4ed8; }
.status-COMPLETED { background: #dcfce7; color: #166534; }
.status-CANCELLED { background: #f1f5f9; color: #64748b; }

.info-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
.info-banner.info { background: #eff6ff; color: #1d4ed8; }
.info-banner.success { background: #f0fdf4; color: #166534; }
.info-banner.danger { background: #fef2f2; color: #991b1b; }

.info-section { margin-bottom: 20px; }
.section-label { font-size: 12px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
.info-grid { display: flex; flex-direction: column; gap: 8px; }
.info-item { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-2); }
.info-key { color: var(--text-3); }
.paid-price { font-size: 18px; font-weight: 800; color: var(--primary); }

.order-actions { display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
.btn-primary { flex: 1; padding: 11px; border-radius: 8px; background: var(--primary); color: #fff; border: none; cursor: pointer; font-size: 15px; font-weight: 600; }
.btn-cancel { padding: 11px 20px; border-radius: 8px; border: 1px solid var(--border); background: transparent; cursor: pointer; font-size: 14px; color: var(--text-2); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.not-found { text-align: center; padding: 60px; color: var(--text-3); }
</style>
