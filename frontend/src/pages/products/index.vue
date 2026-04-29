<template>
  <div class="page-container">
    <div class="products-header">
      <h1 class="page-title">选择服务</h1>
      <p class="page-sub">选择你需要的服务，完成购买后我们将尽快与你联系</p>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading" class="products-grid">
      <div v-for="i in 4" :key="i" class="product-skeleton" />
    </div>

    <!-- 空状态 -->
    <div v-else-if="products.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-title">暂无可用服务</div>
      <div class="empty-sub">管理员还未上架服务，请稍后再来</div>
    </div>

    <!-- 商品网格 -->
    <div v-else class="products-grid">
      <div
        v-for="p in products"
        :key="p.id"
        class="product-card"
        @click="$router.push(`/products/${p.id}`)"
      >
        <div class="product-img-wrap">
          <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" class="product-img" />
          <div v-else class="product-img-placeholder">
            <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
              <rect width="48" height="48" rx="8" fill="currentColor" fill-opacity="0.08"/>
              <path d="M14 34l8-10 6 7 4-5 6 8H14z" fill="currentColor" fill-opacity="0.2"/>
              <circle cx="18" cy="20" r="3" fill="currentColor" fill-opacity="0.3"/>
            </svg>
          </div>
        </div>
        <div class="product-body">
          <h3 class="product-name">{{ p.name }}</h3>
          <p v-if="p.description" class="product-desc">{{ p.description }}</p>
          <div class="product-footer">
            <span class="product-price">¥{{ Number(p.price).toFixed(2) }}</span>
            <button class="btn-buy">立即购买</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const loading = ref(true)
const products = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await api.getProducts()
    products.value = res.data ?? []
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.products-header {
  text-align: center;
  margin-bottom: 32px;
}
.page-title { font-size: 26px; font-weight: 800; color: var(--text-1); margin-bottom: 8px; }
.page-sub { font-size: 14px; color: var(--text-3); }

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.product-card {
  background: var(--card-bg, #fff);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.product-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.10);
  transform: translateY(-2px);
  border-color: var(--primary);
}

.product-img-wrap { width: 100%; aspect-ratio: 16/9; overflow: hidden; background: #f8fafc; }
.product-img { width: 100%; height: 100%; object-fit: cover; }
.product-img-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-3);
}

.product-body { padding: 16px; }
.product-name { font-size: 16px; font-weight: 700; color: var(--text-1); margin-bottom: 6px; }
.product-desc {
  font-size: 13px; color: var(--text-3); line-height: 1.6;
  margin-bottom: 14px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.product-footer { display: flex; align-items: center; justify-content: space-between; }
.product-price { font-size: 20px; font-weight: 800; color: var(--primary); }
.btn-buy {
  padding: 7px 18px; border-radius: 8px;
  background: var(--primary); color: #fff; border: none; cursor: pointer;
  font-size: 13px; font-weight: 600;
  transition: opacity 0.15s;
}
.btn-buy:hover { opacity: 0.85; }

.product-skeleton {
  height: 280px; border-radius: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

.empty-state { text-align: center; padding: 80px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.empty-sub { font-size: 14px; color: var(--text-3); }

@media (max-width: 640px) {
  .products-grid { grid-template-columns: 1fr; gap: 14px; }
  .page-title { font-size: 20px; }
}
</style>
