<template>
  <div class="page-container detail-page">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-wrap">
      <div class="spinner" />
    </div>

    <template v-else-if="product">
      <div class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        返回列表
      </div>

      <div class="detail-layout">
        <!-- 左侧：商品信息 -->
        <div class="detail-main">
          <div class="product-img-wrap">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="product-img" />
            <div v-else class="product-img-placeholder">暂无图片</div>
          </div>
          <div class="product-info">
            <h1 class="product-name">{{ product.name }}</h1>
            <div class="product-price-row">
              <span class="product-price">¥{{ Number(product.price).toFixed(2) }}</span>
            </div>
            <div v-if="product.description" class="product-desc">{{ product.description }}</div>
          </div>
        </div>

        <!-- 右侧：购买面板 -->
        <div class="order-panel card">
          <h3 class="panel-title">购买确认</h3>

          <!-- 备注 -->
          <div class="form-group">
            <label class="form-label">需求备注（可选）</label>
            <textarea v-model="userNote" class="form-textarea" placeholder="说明你的具体需求..." rows="3" />
          </div>

          <!-- 优惠码 -->
          <div class="form-group">
            <label class="form-label">优惠码（可选）</label>
            <div class="coupon-row">
              <input
                v-model="couponCode"
                class="form-input"
                placeholder="输入优惠码"
                :disabled="couponApplied"
                @keyup.enter="validateCoupon"
              />
              <button
                class="btn-coupon"
                :disabled="!couponCode.trim() || couponLoading"
                @click="couponApplied ? clearCoupon() : validateCoupon()"
              >
                {{ couponApplied ? '取消' : '验证' }}
              </button>
            </div>
            <div v-if="couponMsg" class="coupon-msg" :class="couponMsgType">{{ couponMsg }}</div>
          </div>

          <!-- 价格汇总 -->
          <div class="price-summary">
            <div class="price-row">
              <span>原价</span>
              <span>¥{{ Number(product.price).toFixed(2) }}</span>
            </div>
            <div v-if="couponApplied && discountAmount > 0" class="price-row discount">
              <span>优惠</span>
              <span>-¥{{ discountAmount.toFixed(2) }}</span>
            </div>
            <div class="price-row total">
              <span>实付</span>
              <span class="total-price">¥{{ paidPrice.toFixed(2) }}</span>
            </div>
          </div>

          <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>

          <button class="btn-pay" :disabled="creating" @click="handlePay">
            {{ creating ? '创建中...' : '去支付' }}
          </button>
        </div>
      </div>
    </template>

    <div v-else class="not-found">商品不存在或已下架</div>

    <!-- 支付弹窗 -->
    <PaymentModal
      v-if="pendingOrder"
      :order="pendingOrder"
      @paid="handlePaid"
      @close="pendingOrder = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../api'
import PaymentModal from '../../components/PaymentModal.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const product = ref<any>(null)
const userNote = ref('')
const couponCode = ref('')
const couponLoading = ref(false)
const couponApplied = ref(false)
const couponMsg = ref('')
const couponMsgType = ref('success')
const discountAmount = ref(0)
const creating = ref(false)
const errMsg = ref('')
const pendingOrder = ref<any>(null)

const paidPrice = computed(() => {
  const orig = Number(product.value?.price ?? 0)
  return Math.max(orig - discountAmount.value, 0)
})

onMounted(async () => {
  try {
    const res: any = await api.getProduct(route.params.id as string)
    product.value = res.data
  } catch {
    product.value = null
  } finally {
    loading.value = false
  }
})

async function validateCoupon() {
  if (!couponCode.value.trim()) return
  couponLoading.value = true
  couponMsg.value = ''
  try {
    const res: any = await api.validateCoupon(couponCode.value.trim(), product.value.id)
    const d = res.data
    if (!d.valid) {
      const reasons: Record<string, string> = {
        EXPIRED: '优惠码已过期',
        USED_UP: '优惠码已使用完毕',
        NOT_FOUND: '优惠码无效',
        INACTIVE: '优惠码已停用',
      }
      couponMsg.value = reasons[d.reason] ?? '优惠码无效'
      couponMsgType.value = 'error'
    } else {
      discountAmount.value = Number(d.discountAmount)
      couponApplied.value = true
      couponMsg.value = `优惠码有效，优惠 ¥${discountAmount.value.toFixed(2)}`
      couponMsgType.value = 'success'
    }
  } catch {
    couponMsg.value = '校验失败，请稍后重试'
    couponMsgType.value = 'error'
  } finally {
    couponLoading.value = false
  }
}

function clearCoupon() {
  couponApplied.value = false
  couponCode.value = ''
  couponMsg.value = ''
  discountAmount.value = 0
}

async function handlePay() {
  errMsg.value = ''
  creating.value = true
  try {
    const res: any = await api.createProductOrder({
      productId: product.value.id,
      couponCode: couponApplied.value ? couponCode.value.trim() : undefined,
      userNote: userNote.value || undefined,
    })
    pendingOrder.value = res.data
  } catch (err: any) {
    errMsg.value = err?.message ?? '创建订单失败，请重试'
  } finally {
    creating.value = false
  }
}

function handlePaid() {
  router.push('/orders')
}
</script>

<style scoped>
.detail-page { max-width: 900px; margin: 0 auto; }
.loading-wrap { display: flex; justify-content: center; padding: 80px; }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }

.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 14px; color: var(--text-3); cursor: pointer;
  margin-bottom: 24px; padding: 6px 0;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--primary); }

.detail-layout { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }

.product-img-wrap { width: 100%; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; background: #f8fafc; margin-bottom: 20px; }
.product-img { width: 100%; height: 100%; object-fit: cover; }
.product-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-3); font-size: 14px; }

.product-name { font-size: 22px; font-weight: 800; color: var(--text-1); margin-bottom: 12px; }
.product-price-row { margin-bottom: 14px; }
.product-price { font-size: 28px; font-weight: 800; color: var(--primary); }
.product-desc { font-size: 14px; color: var(--text-2); line-height: 1.8; white-space: pre-wrap; }

/* Order Panel */
.order-panel { padding: 24px; }
.panel-title { font-size: 16px; font-weight: 700; color: var(--text-1); margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }
.form-textarea { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 14px; resize: vertical; color: var(--text-1); background: transparent; }
.form-textarea:focus { outline: none; border-color: var(--primary); }

.coupon-row { display: flex; gap: 8px; }
.coupon-row .form-input { flex: 1; }
.btn-coupon {
  padding: 0 14px; border-radius: 8px; border: 1px solid var(--primary); background: transparent;
  color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.btn-coupon:hover:not(:disabled) { background: var(--primary); color: #fff; }
.btn-coupon:disabled { opacity: 0.5; cursor: not-allowed; }
.coupon-msg { margin-top: 6px; font-size: 12px; }
.coupon-msg.success { color: var(--success, #10b981); }
.coupon-msg.error { color: var(--danger, #ef4444); }

.price-summary { border-top: 1px solid var(--border); padding-top: 14px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px; }
.price-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-2); }
.price-row.discount { color: #10b981; }
.price-row.total { font-size: 16px; font-weight: 700; color: var(--text-1); padding-top: 8px; border-top: 1px dashed var(--border); }
.total-price { color: var(--primary); font-size: 20px; }

.err-msg { font-size: 13px; color: var(--danger, #ef4444); margin-bottom: 12px; }

.btn-pay {
  width: 100%; padding: 13px; border-radius: 10px;
  background: var(--primary); color: #fff; border: none; cursor: pointer;
  font-size: 15px; font-weight: 700;
  transition: opacity 0.15s;
}
.btn-pay:hover:not(:disabled) { opacity: 0.88; }
.btn-pay:disabled { opacity: 0.5; cursor: not-allowed; }

.not-found { text-align: center; padding: 80px; color: var(--text-3); font-size: 16px; }

@media (max-width: 768px) {
  .detail-layout { grid-template-columns: 1fr; }
}

/* ── 暗色模式 ── */
[data-theme="dark"] .product-img-wrap { background: #161b22; }
[data-theme="dark"] .price-row.discount { color: #73d13d; }
</style>
