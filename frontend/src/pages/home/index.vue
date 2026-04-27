<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-deco deco1"></div>
      <div class="hero-deco deco2"></div>
      <div class="hero-inner">
        <div class="hero-badge">🎓 专业 · 快速 · 可靠</div>
        <h1 class="hero-title">JT-Hub</h1>
        <p class="hero-sub">期末作业、日常作业、毕业设计，一站式搞定</p>
        <div class="hero-actions">
          <template v-if="store.isLoggedIn">
            <router-link to="/submit" class="hero-btn-primary">立即提交需求 →</router-link>
            <router-link to="/my-orders" class="hero-btn-ghost">查看我的订单</router-link>
          </template>
          <template v-else>
            <button class="hero-btn-primary" @click="openLogin">登录后提交需求 →</button>
          </template>
        </div>
        <!-- 数据展示 -->
        <div class="hero-stats">
          <div class="stat-item"><span class="stat-num">1-2h</span><span class="stat-label">快速响应</span></div>
          <div class="stat-divider"></div>
          <div class="stat-item"><span class="stat-num">100%</span><span class="stat-label">价格透明</span></div>
          <div class="stat-divider"></div>
          <div class="stat-item"><span class="stat-num">7×24</span><span class="stat-label">随时提交</span></div>
        </div>
      </div>
    </section>

    <div class="page-body">
      <!-- 活动公告 -->
      <section class="section" v-if="!loadingActivities || activities.length">
        <div class="section-head">
          <h2 class="section-title">最新动态</h2>
          <span class="section-count" v-if="activities.length">{{ activities.length }} 条</span>
        </div>
        <div v-if="loadingActivities" class="skeleton-grid">
          <div class="skeleton-card" v-for="i in 3" :key="i"></div>
        </div>
        <div v-else-if="activities.length === 0" class="empty-tip">暂无活动公告</div>
        <div v-else class="activity-grid">
          <div v-for="a in activities" :key="a.id"
            class="activity-card"
            :class="a.type === 'PROMO' ? 'type-promo' : 'type-notice'">
            <div class="activity-header">
              <span class="activity-badge">{{ a.type === 'PROMO' ? '🎁 优惠' : '📢 公告' }}</span>
            </div>
            <div class="activity-title">{{ a.title }}</div>
            <div class="activity-content">{{ a.content }}</div>
          </div>
        </div>
      </section>

      <!-- 两栏布局：价格 + 提交入口 -->
      <div class="two-col">
        <!-- 价格参考 -->
        <section class="section price-section">
          <div class="section-head">
            <h2 class="section-title">价格参考</h2>
            <span class="section-hint">最终报价以管理员确认为准</span>
          </div>
          <div class="price-card">
            <div v-if="loadingTypes" class="price-skeleton">
              <div class="skeleton-line" v-for="i in 3" :key="i"></div>
            </div>
            <div v-else>
              <div v-for="(t, i) in orderTypes" :key="t.id"
                class="price-row" :class="{ last: i === orderTypes.length - 1 }"
                @click="goSubmitWithType(t.id)" style="cursor:pointer">
                <div class="price-left">
                  <span class="price-index">{{ i + 1 }}</span>
                  <div>
                    <div class="price-name">{{ t.name }}</div>
                    <div v-if="t.description" class="price-desc">{{ t.description }}</div>
                  </div>
                </div>
                <div class="price-right-wrap">
                  <div class="price-tag">{{ t.price }}</div>
                  <span class="price-arrow">→</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 提交入口 -->
        <section class="section cta-section">
          <div class="cta-card">
            <div class="cta-top">
              <div class="cta-icon">✏️</div>
              <h3 class="cta-title">提交您的需求</h3>
              <p class="cta-desc">填写课程信息，管理员1-2小时内回复，价格透明无隐费</p>
            </div>
            <div class="cta-steps">
              <div class="cta-step"><span class="step-n">1</span><span>登录并填写需求信息</span></div>
              <div class="cta-step"><span class="step-n">2</span><span>添加管理员微信备注订单号</span></div>
              <div class="cta-step"><span class="step-n">3</span><span>等待确认报价，完成交易</span></div>
            </div>
            <div class="cta-wechat">管理员微信：<strong>Jt--04</strong></div>
            <template v-if="store.isLoggedIn">
              <router-link to="/submit" class="cta-btn">立即提交 →</router-link>
            </template>
            <template v-else>
              <button class="cta-btn" @click="openLogin">登录后提交 →</button>
            </template>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { api } from '../../api'

const store = useUserStore()
const router = useRouter()
const activities = ref<any[]>([])
const orderTypes = ref<any[]>([])
const loadingActivities = ref(true)
const loadingTypes = ref(true)
let pollTimer: ReturnType<typeof setInterval> | null = null

const instance = getCurrentInstance()
function openLogin() {
  const parent = instance?.parent?.exposed
  if (parent?.openLogin) parent.openLogin()
}

function goSubmitWithType(typeId: string) {
  if (store.isLoggedIn) {
    router.push({ path: '/submit', query: { typeId } })
  } else {
    openLogin()
  }
}

async function fetchData(silent = false) {
  try {
    const [a, t]: any[] = await Promise.all([api.getActivities(), api.getOrderTypes()])
    activities.value = a.data?.list ?? a.data ?? []
    orderTypes.value = t.data ?? []
  } finally {
    if (!silent) {
      loadingActivities.value = false
      loadingTypes.value = false
    }
  }
}

onMounted(() => {
  fetchData()
  pollTimer = setInterval(() => fetchData(true), 60_000)
})

onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<style scoped>
/* ─── Hero ─── */
.hero {
  background: linear-gradient(160deg, #0c1b4d 0%, #1677ff 55%, #4096ff 100%);
  padding: 100px 32px 80px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.hero-deco {
  position: absolute; border-radius: 50%;
  background: rgba(255,255,255,0.05);
  pointer-events: none;
}
.deco1 { width: 600px; height: 600px; top: -200px; right: -150px; }
.deco2 { width: 400px; height: 400px; bottom: -150px; left: -100px; }
.hero-inner { max-width: 720px; margin: 0 auto; position: relative; z-index: 1; }
.hero-badge {
  display: inline-block; background: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 500;
  padding: 6px 18px; border-radius: 100px; margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.2); letter-spacing: 1px;
}
.hero-title {
  font-size: 72px; font-weight: 900; color: #fff;
  margin-bottom: 16px; letter-spacing: 4px;
  text-shadow: 0 4px 32px rgba(0,0,0,0.2);
}
.hero-sub { font-size: 18px; color: rgba(255,255,255,0.8); margin-bottom: 40px; }
.hero-actions { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 56px; }
.hero-btn-primary {
  background: #fff; color: var(--primary);
  border: none; border-radius: 10px;
  padding: 14px 32px; font-size: 16px; font-weight: 700;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2); cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.25); }
.hero-btn-ghost {
  background: rgba(255,255,255,0.12); color: #fff;
  border: 1.5px solid rgba(255,255,255,0.3);
  border-radius: 10px; padding: 14px 28px; font-size: 15px; font-weight: 500;
  cursor: pointer; transition: background 0.15s;
}
.hero-btn-ghost:hover { background: rgba(255,255,255,0.2); }
.hero-stats { display: flex; align-items: center; justify-content: center; gap: 32px; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 26px; font-weight: 800; color: #fff; }
.stat-label { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }
.stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.2); }

/* ─── Page body ─── */
.page-body { max-width: 1200px; margin: 0 auto; padding: 56px 32px 80px; }
.section { margin-bottom: 48px; }
.section-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
.section-title { font-size: 22px; font-weight: 800; color: var(--text-1); }
.section-count { font-size: 13px; color: var(--text-3); background: #f0f2f5; padding: 2px 10px; border-radius: 100px; }
.section-hint { font-size: 13px; color: var(--text-3); }
.empty-tip { color: var(--text-3); font-size: 15px; padding: 24px 0; }

/* ─── Skeleton ─── */
.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.skeleton-card { height: 140px; border-radius: var(--radius); background: linear-gradient(90deg, #f0f2f5 25%, #e8edf2 50%, #f0f2f5 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-line { height: 20px; border-radius: 6px; margin-bottom: 12px; background: linear-gradient(90deg, #f0f2f5 25%, #e8edf2 50%, #f0f2f5 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-line:last-child { width: 60%; margin-bottom: 0; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* ─── 活动卡片 ─── */
.activity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.activity-card {
  background: var(--card); border-radius: var(--radius-lg);
  padding: 24px; border-top: 4px solid var(--primary);
  box-shadow: var(--shadow-sm); transition: transform 0.2s, box-shadow 0.2s;
}
.activity-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
.activity-card.type-promo { border-top-color: var(--warning); }
.activity-header { margin-bottom: 12px; }
.activity-badge {
  display: inline-block; font-size: 12px; font-weight: 600;
  padding: 4px 12px; border-radius: 100px;
}
.type-notice .activity-badge { background: var(--primary-light); color: var(--primary); }
.type-promo .activity-badge { background: #fff7e6; color: var(--warning); }
.activity-title { font-size: 17px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; line-height: 1.4; }
.activity-content { font-size: 13px; color: var(--text-2); line-height: 1.8; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

/* ─── 两栏 ─── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
@media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

/* ─── 价格卡片 ─── */
.price-card { background: var(--card); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
.price-skeleton { padding: 20px 24px; }
.price-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-bottom: 1px solid #f5f7fa;
}
.price-row.last { border-bottom: none; }
.price-left { display: flex; align-items: flex-start; gap: 14px; }
.price-index {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--primary-light); color: var(--primary);
  font-size: 13px; font-weight: 700; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
}
.price-name { font-size: 15px; font-weight: 600; color: var(--text-1); }
.price-desc { font-size: 12px; color: var(--text-3); margin-top: 3px; }
.price-right-wrap { display: flex; align-items: center; gap: 8px; }
.price-arrow { font-size: 14px; color: var(--text-3); transition: color 0.15s, transform 0.15s; }
.price-row:hover .price-arrow { color: var(--primary); transform: translateX(3px); }
.price-row:hover { background: #f8faff; }
.price-tag {
  background: var(--primary-light); color: var(--primary);
  font-size: 14px; font-weight: 700; padding: 6px 14px;
  border-radius: 8px; white-space: nowrap;
}

/* ─── CTA 卡片 ─── */
.cta-card {
  background: linear-gradient(145deg, #0c1b4d, #1677ff);
  border-radius: var(--radius-lg); padding: 36px 32px;
  color: #fff; height: 100%;
  display: flex; flex-direction: column;
}
.cta-top { margin-bottom: 28px; }
.cta-icon { font-size: 40px; margin-bottom: 14px; }
.cta-title { font-size: 22px; font-weight: 800; margin-bottom: 10px; }
.cta-desc { font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.7; }
.cta-steps { flex: 1; display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px; }
.cta-step { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,0.85); }
.step-n {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,255,255,0.2); font-size: 12px;
  font-weight: 700; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cta-wechat {
  font-size: 13px; color: rgba(255,255,255,0.65);
  margin-bottom: 20px;
}
.cta-wechat strong { color: #fff; }
.cta-btn {
  background: #fff; color: var(--primary);
  border: none; border-radius: 10px;
  padding: 14px; font-size: 15px; font-weight: 700;
  cursor: pointer; text-align: center;
  transition: box-shadow 0.15s, transform 0.15s;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}
.cta-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.25); }
</style>
