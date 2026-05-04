<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">积分商城</h1>
        <p class="page-sub">用积分兑换作业服务或优惠券</p>
      </div>
      <div class="my-balance">
        <span class="balance-label">可用积分</span>
        <span class="balance-num">{{ balance }}</span>
        <router-link to="/points" class="btn btn-secondary btn-sm">明细</router-link>
      </div>
    </div>

    <!-- 类型筛选 -->
    <div class="filter-bar">
      <button :class="['filter-btn', filter === '' && 'active']" @click="filter = ''; loadItems()">全部</button>
      <button :class="['filter-btn', filter === 'SERVICE' && 'active']" @click="filter = 'SERVICE'; loadItems()">服务套餐</button>
      <button :class="['filter-btn', filter === 'COUPON' && 'active']" @click="filter = 'COUPON'; loadItems()">折扣券</button>
    </div>

    <div v-if="loading" class="loading-state">加载中…</div>
    <div v-else-if="items.length === 0" class="empty-state">暂无可兑换商品</div>

    <div class="shop-grid">
      <div v-for="item in items" :key="item.id" class="shop-card">
        <div v-if="item.coverUrl" class="shop-cover">
          <img :src="item.coverUrl" :alt="item.name" />
        </div>
        <div v-else class="shop-cover shop-cover-placeholder">
          <span>{{ item.type === 'COUPON' ? '🎟' : '📚' }}</span>
        </div>
        <div class="shop-body">
          <div class="shop-type-badge" :class="item.type === 'COUPON' ? 'type-coupon' : 'type-service'">
            {{ item.type === 'COUPON' ? '折扣券' : '服务套餐' }}
          </div>
          <div class="shop-name">{{ item.name }}</div>
          <div v-if="item.description" class="shop-desc">{{ item.description }}</div>
          <div v-if="item.type === 'COUPON' && item.discountAmt" class="shop-discount">
            可抵扣 <strong>¥{{ item.discountAmt }}</strong>
          </div>
          <div class="shop-footer">
            <div class="shop-cost">
              <span class="cost-num">{{ item.pointsCost.toLocaleString() }}</span>
              <span class="cost-unit">积分</span>
            </div>
            <div class="shop-stock" v-if="item.stock >= 0">
              <span :class="item.stock === 0 ? 'stock-out' : 'stock-in'">
                {{ item.stock === 0 ? '已售罄' : `剩余 ${item.stock}` }}
              </span>
            </div>
            <button
              class="btn btn-primary btn-sm"
              :disabled="item.stock === 0 || balance < item.pointsCost || submitting === item.id"
              @click="handleRedeem(item)"
            >
              {{ balance < item.pointsCost ? '积分不足' : '立即兑换' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="confirmItem" class="modal-overlay" @click.self="confirmItem = null">
      <div class="modal">
        <h3 class="modal-title">确认兑换</h3>
        <p>确定用 <strong>{{ confirmItem.pointsCost }}</strong> 积分兑换「{{ confirmItem.name }}」？</p>
        <p class="modal-note">兑换后立即生效，请在有效期内使用。服务套餐30天，折扣券7天。</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="confirmItem = null">取消</button>
          <button class="btn btn-primary" :disabled="submitting === confirmItem.id" @click="submitRedeem">
            {{ submitting === confirmItem.id ? '提交中…' : '确认兑换' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const items = ref<any[]>([])
const balance = ref(0)
const filter = ref('')
const loading = ref(false)
const submitting = ref<string | null>(null)
const confirmItem = ref<any>(null)
const message = ref('')

async function loadItems() {
  loading.value = true
  try {
    const params: any = {}
    if (filter.value) params.type = filter.value
    const res: any = await api.getShopItems(params)
    items.value = res.data.list
  } finally {
    loading.value = false
  }
}

async function loadBalance() {
  try {
    const res: any = await api.getPointBalance()
    balance.value = res.data.totalPoints
  } catch {}
}

function handleRedeem(item: any) {
  confirmItem.value = item
}

async function submitRedeem() {
  if (!confirmItem.value) return
  submitting.value = confirmItem.value.id
  try {
    await api.submitRedeem(confirmItem.value.id)
    await loadBalance()
    await loadItems()
    confirmItem.value = null
    alert('兑换成功！请在有效期内使用。')
  } catch (err: any) {
    alert(err?.message ?? '兑换失败，请稍后重试')
  } finally {
    submitting.value = null
  }
}

onMounted(() => {
  loadItems()
  loadBalance()
})
</script>

<style scoped>
.page-container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
.page-sub { color: var(--text-muted); font-size: 0.85rem; margin-top: 4px; }
.my-balance { display: flex; align-items: center; gap: 10px; }
.balance-label { font-size: 0.8rem; color: var(--text-muted); }
.balance-num { font-size: 1.4rem; font-weight: 700; color: var(--color-primary); }

.filter-bar { display: flex; gap: 8px; margin-bottom: 20px; }
.filter-btn { padding: 6px 16px; border: 1px solid var(--border-color); border-radius: 20px; background: var(--bg-card); color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; transition: all .2s; }
.filter-btn.active { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }

.shop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.shop-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; transition: transform .2s, box-shadow .2s; }
.shop-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.shop-cover { height: 140px; overflow: hidden; background: var(--bg-secondary); }
.shop-cover img { width: 100%; height: 100%; object-fit: cover; }
.shop-cover-placeholder { display: flex; align-items: center; justify-content: center; font-size: 3rem; }
.shop-body { padding: 16px; }
.shop-type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; margin-bottom: 8px; }
.type-service { background: #dbeafe; color: #2563eb; }
.type-coupon { background: #fef3c7; color: #d97706; }
.shop-name { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.shop-desc { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.shop-discount { font-size: 0.85rem; color: #d97706; margin-bottom: 8px; }
.shop-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.shop-cost { display: flex; align-items: baseline; gap: 4px; }
.cost-num { font-size: 1.3rem; font-weight: 700; color: var(--color-primary); }
.cost-unit { font-size: 0.75rem; color: var(--text-muted); }
.shop-stock { font-size: 0.75rem; }
.stock-out { color: #ef4444; }
.stock-in { color: #22c55e; }

.btn-sm { padding: 6px 14px; font-size: 0.82rem; }
.loading-state, .empty-state { text-align: center; padding: 48px; color: var(--text-muted); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--bg-card); border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; }
.modal-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); }
.modal-note { font-size: 0.8rem; color: var(--text-muted); margin-top: 8px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
</style>
