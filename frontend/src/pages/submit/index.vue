<template>
  <div class="submit-page">
    <div class="submit-inner">
      <!-- 左侧表单 -->
      <div class="form-panel">
        <div class="form-header">
          <h1 class="form-title">提交需求</h1>
          <p class="form-sub">请填写完整信息，方便管理员快速处理</p>
        </div>

        <div class="form-body">
          <div class="field-group">
            <div class="field">
              <label>课程名称 <span class="req">*</span></label>
              <input v-model="form.courseName" class="input" placeholder="如：高等数学、毕业设计" />
            </div>
            <div class="field">
              <label>需求类型 <span class="req">*</span></label>
              <select v-model="form.orderTypeId" class="input">
                <option value="">请选择需求类型</option>
                <option v-for="t in orderTypes" :key="t.id" :value="t.id">{{ t.name }}（{{ t.price }}）</option>
              </select>
            </div>
          </div>

          <!-- 参考价格提示 -->
          <Transition name="slide">
            <div v-if="selectedType" class="price-tip">
              <span class="price-tip-label">💰 参考价格</span>
              <strong>{{ selectedType.price }}</strong>
              <span v-if="selectedType.description" class="price-tip-desc"> · {{ selectedType.description }}</span>
            </div>
          </Transition>

          <div class="field-group">
            <div class="field">
              <label>年级 <span class="req">*</span></label>
              <select v-model="form.grade" class="input">
                <option value="">请选择年级</option>
                <option value="FRESHMAN">大一</option>
                <option value="SOPHOMORE">大二</option>
                <option value="JUNIOR">大三</option>
              </select>
            </div>
            <div class="field">
              <label>作业截止日期 <span class="req">*</span></label>
              <input v-model="form.deadline" class="input" type="date" :min="today" />
            </div>
          </div>

          <div class="field">
            <label>联系微信号 <span class="req">*</span></label>
            <input v-model="form.contactWechat" class="input" placeholder="管理员将通过此微信与您联系" />
          </div>

          <!-- 积分优惠选择 -->
          <div class="redeem-section" v-if="availableRedeems.length > 0">
            <div class="redeem-header">
              <span class="redeem-icon">🎁</span>
              <span class="redeem-title">积分优惠（可选）</span>
            </div>
            <select v-model="form.redeemItemId" class="input">
              <option value="">不使用积分优惠</option>
              <optgroup label="📦 服务套餐" v-if="serviceRedeems.length">
                <option v-for="r in serviceRedeems" :key="r.id" :value="r.id">
                  {{ r.name }} · {{ formatExpiry(r.expiresAt) }}
                </option>
              </optgroup>
              <optgroup label="🏷️ 折扣券" v-if="couponRedeems.length">
                <option v-for="r in couponRedeems" :key="r.id" :value="r.id">
                  {{ r.name }}{{ r.discountAmt ? ` (${Number(r.discountAmt) * 10}%折扣)` : '' }} · {{ formatExpiry(r.expiresAt) }}
                </option>
              </optgroup>
            </select>

            <!-- 折扣计算预览 -->
            <Transition name="slide">
              <div v-if="selectedRedeem && selectedType" class="discount-preview">
                <div class="discount-row">
                  <span>原价参考</span>
                  <span>{{ selectedType.price }}</span>
                </div>
                <div class="discount-row" v-if="selectedRedeem.discountAmt">
                  <span>折扣券优惠</span>
                  <span class="discount-val">-{{ (Number(selectedRedeem.discountAmt) * 100).toFixed(0) }}%</span>
                </div>
                <div class="discount-row discount-total">
                  <span>预估折后价</span>
                  <span>{{ estimatedPrice }}</span>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- 创建订单后的微信引导 -->
        <Transition name="fade">
          <div v-if="createdOrder" class="success-guide">
            <div class="success-icon">✅</div>
            <h3 class="success-title">订单创建成功！</h3>
            <div class="order-no-display">
              <span class="order-no-label">订单号</span>
              <span class="order-no-val">{{ createdOrder.orderNo }}</span>
              <button class="copy-btn" @click="copyOrderNo">复制</button>
            </div>

            <div class="wechat-guide">
              <div class="guide-step">
                <span class="guide-num">1</span>
                <span>添加管理员微信</span>
              </div>
              <div class="wechat-add-box" @click="copyWechat">
                <div>
                  <div class="wechat-add-label">微信号</div>
                  <div class="wechat-add-val">{{ adminWechat }}</div>
                </div>
                <div class="wechat-add-copy">点击复制</div>
              </div>
              <div class="guide-step">
                <span class="guide-num">2</span>
                <span>发送消息备注订单号：<strong>{{ createdOrder.orderNo }}</strong></span>
              </div>
              <div class="guide-step">
                <span class="guide-num">3</span>
                <span>管理员 1-2 小时内确认并报价</span>
              </div>
            </div>

            <div class="success-actions">
              <router-link to="/orders" class="btn-view-orders">查看我的订单 →</router-link>
              <button class="btn-another" @click="resetForm">再提交一个需求</button>
            </div>
          </div>
        </Transition>

        <button v-if="!createdOrder" class="submit-btn" @click="doSubmit" :disabled="submitting">
          <span v-if="submitting" class="btn-spinner"></span>
          {{ submitting ? '提交中...' : '确认提交' }}
        </button>
      </div>

      <!-- 右侧信息栏 -->
      <aside class="info-panel">
        <div class="info-card">
          <h3 class="info-card-title">📋 流程说明</h3>
          <div class="flow-steps">
            <div class="flow-step">
              <div class="flow-num">1</div>
              <div class="flow-text">
                <div class="flow-step-title">填写需求信息</div>
                <div class="flow-step-desc">选择课程类型和截止日期</div>
              </div>
            </div>
            <div class="flow-line"></div>
            <div class="flow-step">
              <div class="flow-num">2</div>
              <div class="flow-text">
                <div class="flow-step-title">添加管理员微信</div>
                <div class="flow-step-desc">备注订单号，方便快速沟通</div>
              </div>
            </div>
            <div class="flow-line"></div>
            <div class="flow-step">
              <div class="flow-num">3</div>
              <div class="flow-text">
                <div class="flow-step-title">确认报价开始处理</div>
                <div class="flow-step-desc">管理员1-2小时内回复</div>
              </div>
            </div>
          </div>
        </div>

        <div class="info-card contact-info">
          <h3 class="info-card-title">💬 管理员联系方式</h3>
          <div class="wechat-box" @click="copyWechat">
            <div>
              <div class="wechat-label">微信号</div>
              <div class="wechat-val">{{ adminWechat }}</div>
            </div>
            <div class="wechat-copy">点击复制</div>
          </div>
        </div>

        <div v-if="orderTypes.length" class="info-card">
          <h3 class="info-card-title">💰 价格参考</h3>
          <div v-for="t in orderTypes" :key="t.id" class="mini-price">
            <span>{{ t.name }}</span>
            <span class="mini-price-val">{{ t.price }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../../api'

const router = useRouter()
const route = useRoute()
const orderTypes = ref<any[]>([])
const availableRedeems = ref<any[]>([])
const today = new Date().toISOString().slice(0, 10)
const submitting = ref(false)
const form = reactive({ courseName: '', orderTypeId: '', grade: '', deadline: '', contactWechat: '', redeemItemId: '' })
const selectedType = computed(() => orderTypes.value.find(t => t.id === form.orderTypeId) ?? null)
const selectedRedeem = computed(() => availableRedeems.value.find(r => r.id === form.redeemItemId) ?? null)
const adminWechat = ref('Jt--04')
const createdOrder = ref<any>(null)

const serviceRedeems = computed(() => availableRedeems.value.filter(r => r.type === 'SERVICE'))
const couponRedeems = computed(() => availableRedeems.value.filter(r => r.type === 'COUPON'))

const estimatedPrice = computed(() => {
  if (!selectedType.value || !selectedRedeem.value?.discountAmt) return selectedType.value?.price ?? '-'
  const priceStr = selectedType.value.price
  const match = priceStr.match(/(\d+)/)
  if (!match) return priceStr
  const base = parseInt(match[1])
  const discount = Number(selectedRedeem.value.discountAmt)
  const discounted = Math.floor(base * (1 - discount))
  return `${discounted}元起`
})

onMounted(async () => {
  const [typesRes, configRes, redeemRes]: any[] = await Promise.all([
    api.getOrderTypes(), api.getConfig(), api.getAvailableRedeems()
  ])
  orderTypes.value = typesRes.data ?? []
  if (configRes.data?.adminWechatId) adminWechat.value = configRes.data.adminWechatId
  availableRedeems.value = redeemRes.data ?? []
  // 从首页价格行跳转时预选类型
  const preTypeId = route.query.typeId as string
  if (preTypeId && orderTypes.value.some(t => t.id === preTypeId)) {
    form.orderTypeId = preTypeId
  }
})

function formatExpiry(dateStr: string | null) {
  if (!dateStr) return '永久有效'
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000)
  if (diff <= 0) return '已过期'
  if (diff === 1) return '明天过期'
  return `${diff}天后过期`
}

function copyWechat() {
  navigator.clipboard.writeText(adminWechat.value).then(() => alert(`✅ 已复制微信号 ${adminWechat.value}`))
}

function copyOrderNo() {
  if (createdOrder.value) {
    navigator.clipboard.writeText(createdOrder.value.orderNo).then(() => alert('✅ 已复制订单号'))
  }
}

function resetForm() {
  form.courseName = ''
  form.orderTypeId = ''
  form.grade = ''
  form.deadline = ''
  form.contactWechat = ''
  form.redeemItemId = ''
  createdOrder.value = null
}

async function doSubmit() {
  if (!form.courseName.trim()) return alert('请填写课程名称')
  if (!form.orderTypeId) return alert('请选择需求类型')
  if (!form.grade) return alert('请选择年级')
  if (!form.deadline) return alert('请选择截止日期')
  if (!form.contactWechat.trim()) return alert('请填写联系微信号')
  submitting.value = true
  try {
    const payload: any = {
      courseName: form.courseName,
      orderTypeId: form.orderTypeId,
      grade: form.grade,
      deadline: new Date(form.deadline + 'T23:59:59Z').toISOString(),
      contactWechat: form.contactWechat,
      source: 'PC',
    }
    if (form.redeemItemId) payload.redeemItemId = form.redeemItemId
    const res: any = await api.createOrder(payload)
    createdOrder.value = { orderNo: res.data.orderNo, adminWechatId: res.data.adminWechatId }
    if (res.data.adminWechatId) adminWechat.value = res.data.adminWechatId
  } catch (e: any) {
    alert(e.message ?? '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.submit-page { padding: 40px 32px 80px; background: var(--bg); min-height: calc(100vh - 64px); }
.submit-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
@media (max-width: 900px) { .submit-inner { grid-template-columns: 1fr; } }

/* ─── 左侧表单面板 ─── */
.form-panel { background: var(--card); border-radius: var(--radius-lg); padding: 40px; box-shadow: var(--shadow); }
.form-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.form-title { font-size: 26px; font-weight: 800; color: var(--text-1); margin-bottom: 6px; }
.form-sub { font-size: 14px; color: var(--text-3); }
.form-body { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
.field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 600px) { .field-group { grid-template-columns: 1fr; } }

.field { display: flex; flex-direction: column; gap: 8px; }
.field label { font-size: 13px; font-weight: 600; color: var(--text-2); }
.req { color: var(--danger); }
.input {
  border: 1.5px solid var(--border); border-radius: var(--radius-sm);
  padding: 10px 14px; font-size: 15px; color: var(--text-1);
  background: #fafbfc; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  width: 100%;
}
.input:focus {
  border-color: var(--primary); background: #fff;
  box-shadow: 0 0 0 3px rgba(22,119,255,0.1);
}

/* 参考价格提示 */
.price-tip {
  background: var(--primary-light); border-radius: var(--radius-sm);
  padding: 12px 16px; font-size: 14px; color: var(--primary);
  display: flex; align-items: center; gap: 8px;
}
.price-tip-label { font-weight: 600; }
.price-tip-desc { color: #5c9af5; font-size: 13px; }
.slide-enter-active, .slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 积分优惠选择 */
.redeem-section {
  background: #f0f9ff; border: 1px solid #bae0ff;
  border-radius: var(--radius-sm); padding: 16px;
}
.redeem-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.redeem-icon { font-size: 16px; }
.redeem-title { font-size: 14px; font-weight: 600; color: var(--text-1); }

/* 折扣预览 */
.discount-preview {
  margin-top: 12px; background: #fff; border-radius: var(--radius-sm);
  padding: 12px 16px; border: 1px solid #e6f4ff;
}
.discount-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: var(--text-2); }
.discount-val { color: var(--danger); font-weight: 600; }
.discount-total { border-top: 1px solid var(--border); margin-top: 4px; padding-top: 8px; font-weight: 700; color: var(--text-1); font-size: 15px; }

/* 创建成功引导 */
.success-guide {
  text-align: center; padding: 32px 0;
  animation: fadeInUp 0.4s ease;
}
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.success-icon { font-size: 48px; margin-bottom: 12px; }
.success-title { font-size: 22px; font-weight: 800; color: var(--text-1); margin-bottom: 20px; }

.order-no-display {
  display: inline-flex; align-items: center; gap: 12px;
  background: #f0f9ff; border: 1px solid #bae0ff;
  border-radius: var(--radius); padding: 12px 20px; margin-bottom: 24px;
}
.order-no-label { font-size: 13px; color: var(--text-3); }
.order-no-val { font-size: 20px; font-weight: 800; color: var(--primary); font-family: monospace; letter-spacing: 1px; }
.copy-btn {
  background: var(--primary); color: #fff; border: none;
  border-radius: 6px; padding: 4px 12px; font-size: 12px; cursor: pointer;
}

.wechat-guide {
  text-align: left; max-width: 400px; margin: 0 auto 24px;
  display: flex; flex-direction: column; gap: 12px;
}
.guide-step { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-2); }
.guide-num {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--primary); color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.wechat-add-box {
  background: linear-gradient(135deg, #0c1b4d, #1677ff);
  border-radius: var(--radius-sm); padding: 16px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; transition: transform 0.15s;
}
.wechat-add-box:hover { transform: scale(1.02); }
.wechat-add-label { font-size: 12px; color: rgba(255,255,255,0.6); }
.wechat-add-val { font-size: 22px; font-weight: 800; color: #fff; }
.wechat-add-copy { font-size: 12px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 6px; }

.success-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.btn-view-orders {
  background: var(--primary); color: #fff; border: none;
  border-radius: var(--radius); padding: 12px 24px; font-size: 15px; font-weight: 600;
  text-decoration: none; transition: opacity 0.15s;
}
.btn-view-orders:hover { opacity: 0.9; }
.btn-another {
  background: transparent; color: var(--text-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 12px 24px; font-size: 15px; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-another:hover { border-color: var(--primary); color: var(--primary); }

/* 提交按钮 */
.submit-btn {
  width: 100%; background: linear-gradient(135deg, var(--primary), #4096ff);
  color: #fff; border: none; border-radius: var(--radius);
  padding: 16px; font-size: 16px; font-weight: 700;
  box-shadow: 0 6px 24px rgba(22,119,255,0.3);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: opacity 0.15s, box-shadow 0.15s;
}
.submit-btn:hover:not(:disabled) { box-shadow: 0 10px 32px rgba(22,119,255,0.4); }
.submit-btn:disabled { opacity: 0.6; box-shadow: none; cursor: not-allowed; }
.btn-spinner {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── 右侧信息栏 ─── */
.info-panel { display: flex; flex-direction: column; gap: 16px; }
.info-card { background: var(--card); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
.info-card-title { font-size: 15px; font-weight: 700; color: var(--text-1); margin-bottom: 18px; }

.flow-steps { display: flex; flex-direction: column; }
.flow-step { display: flex; gap: 14px; align-items: flex-start; }
.flow-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #4096ff);
  color: #fff; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 3px 10px rgba(22,119,255,0.3);
}
.flow-step-title { font-size: 14px; font-weight: 600; color: var(--text-1); margin-bottom: 2px; }
.flow-step-desc { font-size: 12px; color: var(--text-3); }
.flow-line { width: 1px; height: 20px; background: var(--border); margin: 6px 0 6px 13px; }

.contact-info { background: linear-gradient(135deg, #0c1b4d, #1677ff); }
.contact-info .info-card-title { color: rgba(255,255,255,0.8); }
.wechat-box {
  background: rgba(255,255,255,0.12); border-radius: var(--radius-sm);
  padding: 14px 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  transition: background 0.15s;
}
.wechat-box:hover { background: rgba(255,255,255,0.2); }
.wechat-label { font-size: 12px; color: rgba(255,255,255,0.6); }
.wechat-val { font-size: 18px; font-weight: 800; color: #fff; }
.wechat-copy { font-size: 12px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px; }

.mini-price { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
.mini-price:last-child { border-bottom: none; padding-bottom: 0; }
.mini-price-val { font-weight: 700; color: var(--primary); }
</style>
