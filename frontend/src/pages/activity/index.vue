<template>
  <div class="activity-page">
    <div class="page-top">
      <h1 class="page-title">活动 &amp; 公告</h1>
      <p class="page-sub">最新优惠活动与系统公告</p>
    </div>

    <div class="page-body">
      <!-- 骨架屏 -->
      <div v-if="loading" class="activity-grid">
        <div class="skeleton-card" v-for="i in 6" :key="i"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="list.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">暂无活动公告</div>
      </div>

      <!-- 列表 -->
      <div v-else class="activity-grid">
        <div
          v-for="item in list" :key="item.id"
          class="activity-card"
          :class="[item.type === 'PROMO' ? 'type-promo' : 'type-notice', { expired: item.isExpired }]"
        >
          <div class="card-header">
            <span class="card-badge">{{ item.type === 'PROMO' ? '🎁 优惠活动' : '📢 系统公告' }}</span>
            <div class="card-tags">
              <span v-if="item.isExpired" class="tag-expired">已结束</span>
              <span v-else-if="item.daysLeft === 0" class="tag-today">今天截止</span>
              <span v-else-if="item.daysLeft != null" class="tag-days">还剩 {{ item.daysLeft }} 天</span>
            </div>
          </div>
          <div class="card-title">{{ item.title }}</div>
          <div class="card-content">{{ item.content }}</div>
          <div class="card-date">{{ fmtDate(item.startAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '../../api'

const list = ref<any[]>([])
const loading = ref(true)
let timer: ReturnType<typeof setInterval> | null = null

const fmtDate = (d: string) => new Date(d).toLocaleDateString('zh-CN')

async function fetchActivities() {
  try {
    const res: any = await api.getActivities()
    list.value = res.data?.list ?? res.data ?? []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchActivities()
  timer = setInterval(fetchActivities, 60_000)
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.activity-page { background: var(--bg); min-height: calc(100vh - var(--nav-h)); }

.page-top {
  background: linear-gradient(160deg, #0c1b4d 0%, #1677ff 100%);
  padding: 60px 32px 48px; text-align: center;
}
.page-title { font-size: 36px; font-weight: 900; color: #fff; margin-bottom: 10px; }
.page-sub { font-size: 15px; color: rgba(255,255,255,0.75); }

.page-body { max-width: 1200px; margin: 0 auto; padding: 48px 32px 80px; }

@media (max-width: 640px) {
  .page-top { padding: 40px 20px 32px; }
  .page-title { font-size: 26px; }
  .page-body { padding: 20px 14px 80px; }
  .activity-grid { grid-template-columns: 1fr; gap: 14px; }
  .activity-card { padding: 20px; }
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

/* 骨架屏 */
.skeleton-card {
  height: 180px; border-radius: var(--radius-lg);
  background: linear-gradient(90deg, #f0f2f5 25%, #e8edf2 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }

/* 空状态 */
.empty-state { text-align: center; padding: 80px 0; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-text { font-size: 16px; color: var(--text-3); }

/* 卡片 */
.activity-card {
  background: var(--card); border-radius: var(--radius-lg);
  padding: 28px; border-top: 4px solid var(--primary);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex; flex-direction: column; gap: 10px;
}
.activity-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
.activity-card.type-promo { border-top-color: var(--warning); }
.activity-card.expired { opacity: 0.65; border-top-color: #d9d9d9; }

.card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.card-badge {
  font-size: 12px; font-weight: 600; padding: 4px 12px;
  border-radius: 100px;
}
.type-notice .card-badge { background: var(--primary-light); color: var(--primary); }
.type-promo .card-badge { background: #fff7e6; color: var(--warning); }

.card-tags { display: flex; gap: 6px; }
.tag-expired { font-size: 11px; padding: 3px 10px; border-radius: 100px; background: #f5f5f5; color: #999; }
.tag-today   { font-size: 11px; padding: 3px 10px; border-radius: 100px; background: #fff2e8; color: #d46b08; }
.tag-days    { font-size: 11px; padding: 3px 10px; border-radius: 100px; background: #e6fffb; color: #08979c; }

.card-title { font-size: 17px; font-weight: 700; color: var(--text-1); line-height: 1.4; }
.card-content { font-size: 13px; color: var(--text-2); line-height: 1.8; flex: 1; }
.card-date { font-size: 12px; color: var(--text-3); }

/* ── 暗色模式 ── */
[data-theme="dark"] .skeleton-card {
  background: linear-gradient(90deg, #1c2333 25%, #252d3f 50%, #1c2333 75%);
  background-size: 200% 100%;
}
[data-theme="dark"] .type-promo .card-badge { background: rgba(250,140,22,0.12); }
[data-theme="dark"] .activity-card.expired { border-top-color: #30363d; }
</style>
