<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box">
        <button class="modal-close" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <h3 class="modal-title">扫码支付</h3>
        <p class="modal-sub">请选择支付方式，扫码转账并<strong>备注订单号</strong></p>

        <div class="order-no-tip">
          <span class="tip-label">订单号：</span>
          <span class="tip-no">{{ order.orderNo }}</span>
          <button class="copy-btn" @click="copyOrderNo">{{ copied ? '已复制' : '复制' }}</button>
        </div>

        <div v-if="loading" class="qr-loading">加载收款码中...</div>
        <div v-else class="qr-tabs">
          <div class="tab-bar">
            <button class="tab" :class="{ active: activeTab === 'wechat' }" @click="activeTab = 'wechat'">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M7.5 4C4.46 4 2 6.24 2 9c0 1.46.65 2.77 1.69 3.7L3 15l2.3-1.15A6.3 6.3 0 0 0 7.5 14c3.04 0 5.5-2.24 5.5-5S10.54 4 7.5 4z"/><path d="M13 9c-2.21 0-4 1.57-4 3.5S10.79 16 13 16c.56 0 1.1-.1 1.58-.27L17 17l-.58-1.94A3.44 3.44 0 0 0 17 12.5C17 10.57 15.21 9 13 9z"/></svg>
              微信支付
            </button>
            <button class="tab" :class="{ active: activeTab === 'alipay' }" @click="activeTab = 'alipay'">
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm.5 11.5H8v-5h2.5v5zm0-6H8V6h2.5v1.5z"/></svg>
              支付宝
            </button>
          </div>

          <div class="qr-wrap">
            <template v-if="activeTab === 'wechat'">
              <img v-if="config.wechatUrl" :src="config.wechatUrl" alt="微信收款码" class="qr-img" />
              <div v-else class="qr-empty">管理员暂未配置微信收款码</div>
            </template>
            <template v-else>
              <img v-if="config.alipayUrl" :src="config.alipayUrl" alt="支付宝收款码" class="qr-img" />
              <div v-else class="qr-empty">管理员暂未配置支付宝收款码</div>
            </template>
          </div>
        </div>

        <div class="amount-row">
          实付金额：<strong class="amount">¥{{ Number(order.paidPrice).toFixed(2) }}</strong>
        </div>

        <div v-if="errMsg" class="err-msg">{{ errMsg }}</div>

        <button class="btn-paid" :disabled="paying" @click="handlePaid">
          {{ paying ? '处理中...' : '我已支付' }}
        </button>
        <p class="btn-note">点击后订单状态将更新为"已支付"，等待管理员核对</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../api'

const props = defineProps<{ order: { id: string; orderNo: string; paidPrice: number | string } }>()
const emit = defineEmits<{ paid: []; close: [] }>()

const loading = ref(true)
const config = ref<{ wechatUrl?: string; alipayUrl?: string }>({})
const activeTab = ref<'wechat' | 'alipay'>('wechat')
const paying = ref(false)
const errMsg = ref('')
const copied = ref(false)

onMounted(async () => {
  try {
    const res: any = await api.getPaymentConfig()
    config.value = res.data ?? {}
    if (!config.value.wechatUrl && config.value.alipayUrl) activeTab.value = 'alipay'
  } finally {
    loading.value = false
  }
})

async function handlePaid() {
  errMsg.value = ''
  paying.value = true
  try {
    await api.payProductOrder(props.order.id)
    emit('paid')
  } catch (err: any) {
    errMsg.value = err?.message ?? '操作失败，请重试'
  } finally {
    paying.value = false
  }
}

async function copyOrderNo() {
  try {
    await navigator.clipboard.writeText(props.order.orderNo)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-box {
  background: #fff; border-radius: 16px; padding: 28px 24px;
  width: 100%; max-width: 400px; position: relative;
  animation: pop 0.2s ease;
}
@keyframes pop { from { transform: scale(0.92); opacity: 0 } to { transform: scale(1); opacity: 1 } }
.modal-close {
  position: absolute; top: 14px; right: 14px;
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: #f1f5f9; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.modal-title { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 6px; }
.modal-sub { font-size: 13px; color: #64748b; margin-bottom: 14px; }

.order-no-tip {
  display: flex; align-items: center; gap: 8px;
  background: #f8fafc; border-radius: 8px; padding: 8px 12px; margin-bottom: 16px;
}
.tip-label { font-size: 12px; color: #94a3b8; }
.tip-no { font-size: 13px; font-family: monospace; font-weight: 600; color: #1e293b; flex: 1; }
.copy-btn { font-size: 11px; color: #0ea5e9; border: none; background: none; cursor: pointer; padding: 2px 6px; border-radius: 4px; }
.copy-btn:hover { background: #e0f2fe; }

.qr-loading { text-align: center; padding: 40px; color: #94a3b8; font-size: 14px; }

.tab-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: transparent; cursor: pointer; font-size: 13px; color: #64748b;
  transition: all 0.15s;
}
.tab.active { border-color: #0ea5e9; background: #eff6ff; color: #0369a1; font-weight: 600; }

.qr-wrap { display: flex; justify-content: center; margin-bottom: 16px; }
.qr-img { width: 180px; height: 180px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; }
.qr-empty { width: 180px; height: 180px; display: flex; align-items: center; justify-content: center; border: 1px dashed #e2e8f0; border-radius: 8px; font-size: 13px; color: #94a3b8; text-align: center; padding: 12px; }

.amount-row { text-align: center; font-size: 14px; color: #64748b; margin-bottom: 12px; }
.amount { font-size: 20px; font-weight: 800; color: #0ea5e9; }

.err-msg { font-size: 13px; color: #ef4444; text-align: center; margin-bottom: 8px; }

.btn-paid {
  width: 100%; padding: 13px; border-radius: 10px;
  background: #0ea5e9; color: #fff; border: none; cursor: pointer;
  font-size: 15px; font-weight: 700; margin-bottom: 8px;
  transition: opacity 0.15s;
}
.btn-paid:hover:not(:disabled) { opacity: 0.88; }
.btn-paid:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-note { text-align: center; font-size: 12px; color: #94a3b8; }
</style>
