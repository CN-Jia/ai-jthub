<template>
  <div class="home">
    <!-- ══════════ Hero ══════════ -->
    <section class="hero">
      <canvas ref="cvs" class="hero-canvas" />
      <div class="hero-inner">
        <div class="hero-eyebrow" :class="{ visible: heroVis }">
          <span class="eyebrow-pill">🎓 专业 · 快速 · 可靠</span>
        </div>
        <h1 class="hero-title" :class="{ visible: heroVis }">
          让学业<br /><span class="grad-text">不再是负担</span>
        </h1>
        <p class="hero-sub" :class="{ visible: heroVis }">期末作业、日常作业、毕业设计，一站式搞定</p>
        <div class="hero-actions" :class="{ visible: heroVis }">
          <template v-if="store.isLoggedIn">
            <router-link to="/submit" class="btn-hero-primary">立即提交需求 →</router-link>
            <router-link to="/my-orders" class="btn-hero-ghost">查看我的订单</router-link>
          </template>
          <template v-else>
            <button class="btn-hero-primary" @click="openLogin">立即开始 →</button>
            <router-link to="/register" class="btn-hero-ghost">免费注册</router-link>
          </template>
        </div>

        <!-- 统计数据 -->
        <div class="hero-stats" :class="{ visible: heroVis }">
          <div class="stat-item">
            <span class="stat-num">{{ counters[0] }}<em>h</em></span>
            <span class="stat-label">快速响应</span>
          </div>
          <div class="stat-line" />
          <div class="stat-item">
            <span class="stat-num">{{ counters[1] }}<em>%</em></span>
            <span class="stat-label">价格透明</span>
          </div>
          <div class="stat-line" />
          <div class="stat-item">
            <span class="stat-num">7<em>×24</em></span>
            <span class="stat-label">全天在线</span>
          </div>
          <div class="stat-line" />
          <div class="stat-item">
            <span class="stat-num">{{ counters[2] }}<em>+</em></span>
            <span class="stat-label">完成案例</span>
          </div>
        </div>
      </div>

      <!-- 向下滚动提示 -->
      <div class="scroll-hint">
        <div class="scroll-mouse"><div class="scroll-dot" /></div>
      </div>
    </section>

    <!-- ══════════ 特性卡片 ══════════ -->
    <section class="features-section">
      <div class="section-wrap">
        <div class="sec-header reveal">
          <span class="sec-tag">为什么选择我们</span>
          <h2 class="sec-title">专注品质，服务优先</h2>
        </div>
        <div class="features-grid">
          <div v-for="(f, i) in features" :key="i"
            class="feat-card reveal" :style="`--delay:${i * 80}ms`">
            <div class="feat-icon">{{ f.icon }}</div>
            <h3 class="feat-title">{{ f.title }}</h3>
            <p class="feat-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════ 作品轮播 ══════════ -->
    <section v-if="carousel.length" class="showcase-section">
      <div class="section-wrap">
        <div class="sec-header reveal">
          <span class="sec-tag">历代作品</span>
          <h2 class="sec-title">真实完成案例，品质有目共睹</h2>
        </div>
        <div class="showcase-track">
          <div class="carousel-slide reveal" v-for="(item, i) in carousel" :key="item.id"
            :style="`--delay:${i * 60}ms`">
            <div class="slide-img-wrap">
              <img :src="item.imageUrl" :alt="item.courseName" class="slide-img" loading="lazy" />
              <span class="slide-tag">{{ item.orderType }}</span>
            </div>
            <div class="slide-body">
              <div class="slide-course">{{ item.courseName }}</div>
              <div v-if="item.review" class="slide-review">"{{ item.review }}"</div>
              <div class="slide-meta">
                <span v-if="item.orderNoMask" class="slide-no">{{ item.orderNoMask }}</span>
                <span>{{ fmtDate(item.completedAt) }}完成</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════ 主体内容 ══════════ -->
    <div class="page-body">
      <!-- 最新动态 -->
      <section class="section reveal" v-if="activities.length || loadingActivities">
        <div class="section-head">
          <h2 class="section-title">最新动态</h2>
          <span class="section-count" v-if="activities.length">{{ activities.length }} 条</span>
        </div>
        <div v-if="loadingActivities" class="skeleton-grid">
          <div class="skeleton-card" v-for="i in 3" :key="i" />
        </div>
        <div v-else class="activity-grid">
          <div v-for="(a, i) in activities" :key="a.id"
            class="activity-card reveal" :style="`--delay:${i * 60}ms`"
            :class="a.type === 'PROMO' ? 'type-promo' : 'type-notice'">
            <div class="activity-badge">{{ a.type === 'PROMO' ? '🎁 优惠' : '📢 公告' }}</div>
            <div class="activity-title">{{ a.title }}</div>
            <div class="activity-content">{{ a.content }}</div>
          </div>
        </div>
      </section>

      <!-- 两栏：价格 + 提交入口 -->
      <div class="two-col">
        <!-- 价格参考 -->
        <section class="section reveal">
          <div class="section-head">
            <h2 class="section-title">价格参考</h2>
            <span class="section-hint">最终报价以管理员确认为准</span>
          </div>
          <div class="price-card">
            <div v-if="loadingTypes" class="price-skeleton">
              <div class="skeleton-line" v-for="i in 4" :key="i" />
            </div>
            <div v-else>
              <div v-for="(t, i) in orderTypes" :key="t.id"
                class="price-row" :class="{ last: i === orderTypes.length - 1 }"
                @click="goSubmitWithType(t.id)">
                <div class="price-left">
                  <span class="price-idx">{{ i + 1 }}</span>
                  <div>
                    <div class="price-name">{{ t.name }}</div>
                    <div v-if="t.description" class="price-desc">{{ t.description }}</div>
                  </div>
                </div>
                <div class="price-right">
                  <span class="price-tag">{{ t.price }}</span>
                  <span class="price-arrow">→</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 提交入口 CTA -->
        <section class="section reveal" style="--delay:100ms">
          <div class="cta-card">
            <div class="cta-glow" />
            <div class="cta-icon">✏️</div>
            <h3 class="cta-title">提交您的需求</h3>
            <p class="cta-desc">填写课程信息，管理员 1-2 小时内回复，价格透明无隐费</p>
            <div class="cta-steps">
              <div class="cta-step"><span class="step-n">1</span><span>登录并填写需求信息</span></div>
              <div class="cta-step"><span class="step-n">2</span><span>添加管理员微信备注订单号</span></div>
              <div class="cta-step"><span class="step-n">3</span><span>确认报价，完成交易</span></div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { api } from '../../api'

const store = useUserStore()
const router = useRouter()
const activities = ref<any[]>([])
const orderTypes = ref<any[]>([])
const carousel = ref<any[]>([])
const loadingActivities = ref(true)
const loadingTypes = ref(true)
const heroVis = ref(false)
const cvs = ref<HTMLCanvasElement | null>(null)
const counters = ref([1, 99, 199])
let pollTimer: ReturnType<typeof setInterval> | null = null
let rafId = 0

const fmtDate = (d: string) => {
  const dt = new Date(d)
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月`
}
function openLogin() { router.push('/login') }
function goSubmitWithType(id: string) {
  store.isLoggedIn ? router.push({ path: '/submit', query: { typeId: id } }) : openLogin()
}

const features = [
  { icon: '⚡', title: '快速响应', desc: '提交需求后 1-2 小时内管理员确认，不让您干等。' },
  { icon: '💎', title: '品质保障', desc: '每份作业认真对待，不满意可修改，质量优先。' },
  { icon: '💰', title: '价格透明', desc: '先报价再付款，无隐藏收费，价格清晰明了。' },
  { icon: '🔒', title: '隐私安全', desc: '订单信息严格保密，仅您与管理员可见。' },
]

// ── 粒子系统 ──────────────────────────────
interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number }
function initCanvas() {
  const el = cvs.value
  if (!el) return
  const ctx = el.getContext('2d')!
  let W = 0, H = 0
  const particles: Particle[] = []

  function resize() {
    W = el.offsetWidth
    H = el.offsetHeight
    el.width = W * devicePixelRatio
    el.height = H * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)
  }

  function spawn() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.5 + 0.2,
    }
  }

  resize()
  for (let i = 0; i < 90; i++) particles.push(spawn())
  window.addEventListener('resize', resize)

  function draw() {
    ctx.clearRect(0, 0, W, H)
    const LINK = 120
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      p.x += p.vx; p.y += p.vy
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
      ctx.fill()

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j]
        const dx = p.x - q.x, dy = p.y - q.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < LINK) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y)
          ctx.strokeStyle = `rgba(255,255,255,${0.08 * (1 - dist / LINK)})`
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
      }
    }
    rafId = requestAnimationFrame(draw)
  }
  draw()

  return () => {
    window.removeEventListener('resize', resize)
    cancelAnimationFrame(rafId)
  }
}

// ── 计数器动画 ──────────────────────────────
function animateCounters() {
  const targets = [2, 100, 200]
  const durations = [800, 1200, 1500]
  targets.forEach((target, i) => {
    const start = performance.now()
    function tick(now: number) {
      const t = Math.min((now - start) / durations[i], 1)
      const ease = 1 - Math.pow(1 - t, 3)
      counters.value[i] = Math.round(ease * target)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

// ── Intersection Observer ──────────────────
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        (e.target as HTMLElement).classList.add('revealed')
        obs.unobserve(e.target)
      }
    })
  }, { threshold: 0.12 })
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
  return obs
}

async function fetchData(silent = false) {
  try {
    const [a, t, c]: any[] = await Promise.all([api.getActivities(), api.getOrderTypes(), api.getCarousel()])
    activities.value = a.data?.list ?? a.data ?? []
    orderTypes.value = t.data ?? []
    carousel.value = c.data ?? []
  } finally {
    if (!silent) { loadingActivities.value = false; loadingTypes.value = false }
  }
}

let cleanup: (() => void) | undefined
let revealObs: IntersectionObserver | undefined

onMounted(() => {
  setTimeout(() => { heroVis.value = true }, 80)
  setTimeout(animateCounters, 500)
  cleanup = initCanvas()
  fetchData().then(() => {
    setTimeout(() => { revealObs = initReveal() }, 100)
  })
  pollTimer = setInterval(() => fetchData(true), 60_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  cleanup?.()
  revealObs?.disconnect()
})
</script>

<style scoped>
/* ═══ 全局 ═══ */
.home { overflow-x: hidden; }

/* ═══ Hero ═══ */
.hero {
  position: relative;
  min-height: 100vh;
  /* 向上延伸到导航栏后面，让透明导航生效 */
  margin-top: calc(-1 * var(--nav-h));
  padding-top: var(--nav-h);
  background: linear-gradient(135deg, #060d24 0%, #0b1d52 35%, #1354c5 70%, #2563eb 100%);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.hero-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none;
}
.hero-inner {
  position: relative; z-index: 2;
  text-align: center; padding: 80px 24px 120px;
  max-width: 780px; margin: 0 auto;
}

/* 入场动画 */
.hero-eyebrow, .hero-title, .hero-sub, .hero-actions, .hero-stats {
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.hero-eyebrow.visible { opacity: 1; transform: none; transition-delay: 0s; }
.hero-title.visible   { opacity: 1; transform: none; transition-delay: 0.12s; }
.hero-sub.visible     { opacity: 1; transform: none; transition-delay: 0.22s; }
.hero-actions.visible { opacity: 1; transform: none; transition-delay: 0.32s; }
.hero-stats.visible   { opacity: 1; transform: none; transition-delay: 0.44s; }

.eyebrow-pill {
  display: inline-block;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.22);
  color: rgba(255,255,255,0.9);
  font-size: 13px; font-weight: 500;
  padding: 6px 20px; border-radius: 100px;
  letter-spacing: 1.5px;
  margin-bottom: 24px;
  backdrop-filter: blur(8px);
}
.hero-title {
  font-size: clamp(44px, 7vw, 80px);
  font-weight: 900; color: #fff; line-height: 1.15;
  margin-bottom: 18px; letter-spacing: -1px;
  text-shadow: 0 4px 40px rgba(0,0,0,0.3);
}
.grad-text {
  background: linear-gradient(90deg, #60a5fa, #a78bfa, #34d399);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: gradShift 4s linear infinite;
}
@keyframes gradShift { to { background-position: 200% center; } }

.hero-sub {
  font-size: 18px; color: rgba(255,255,255,0.72);
  margin-bottom: 40px; line-height: 1.7;
}
.hero-actions { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 56px; }

.btn-hero-primary {
  background: #fff; color: #1354c5;
  border: none; border-radius: 12px;
  padding: 14px 36px; font-size: 16px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative; overflow: hidden;
}
.btn-hero-primary::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(99,102,241,0.15));
}
.btn-hero-primary:hover { transform: translateY(-3px); box-shadow: 0 14px 40px rgba(0,0,0,0.3); }

.btn-hero-ghost {
  background: rgba(255,255,255,0.1); color: #fff;
  border: 1.5px solid rgba(255,255,255,0.3);
  border-radius: 12px; padding: 14px 28px; font-size: 15px; font-weight: 500;
  backdrop-filter: blur(8px);
  transition: background 0.15s, border-color 0.15s;
}
.btn-hero-ghost:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.5); }

/* Stats */
.hero-stats {
  display: flex; align-items: center; justify-content: center;
  gap: 24px; flex-wrap: wrap;
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-num {
  font-size: 32px; font-weight: 900; color: #fff; line-height: 1;
  font-variant-numeric: tabular-nums;
}
.stat-num em { font-size: 16px; font-style: normal; opacity: 0.8; }
.stat-label { font-size: 12px; color: rgba(255,255,255,0.55); letter-spacing: 0.05em; }
.stat-line { width: 1px; height: 40px; background: rgba(255,255,255,0.18); }

/* Scroll hint */
.scroll-hint {
  position: absolute; bottom: 28px; left: 50%;
  transform: translateX(-50%);
  animation: bounce 2s ease-in-out infinite;
}
.scroll-mouse {
  width: 22px; height: 34px; border: 2px solid rgba(255,255,255,0.4);
  border-radius: 11px; display: flex; align-items: flex-start;
  justify-content: center; padding-top: 5px;
}
.scroll-dot {
  width: 4px; height: 8px; background: rgba(255,255,255,0.7);
  border-radius: 2px; animation: scrollDot 2s ease-in-out infinite;
}
@keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(6px); } }
@keyframes scrollDot { 0%,100% { opacity: 1; transform: translateY(0); } 50% { opacity: 0.3; transform: translateY(6px); } }

/* ═══ Reveal 动画 ═══ */
.reveal {
  opacity: 0; transform: translateY(30px);
  transition: opacity 0.6s ease calc(var(--delay, 0ms)), transform 0.6s ease calc(var(--delay, 0ms));
}
.reveal.revealed { opacity: 1; transform: none; }

/* ═══ Section 通用 ═══ */
.section-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.sec-header { text-align: center; margin-bottom: 44px; }
.sec-tag {
  display: inline-block; font-size: 12px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--primary); background: var(--primary-light);
  padding: 5px 14px; border-radius: 100px; margin-bottom: 14px;
}
.sec-title { font-size: clamp(22px, 3vw, 32px); font-weight: 800; color: var(--text-1); }

/* ═══ Features ═══ */
.features-section { padding: 96px 0; background: #fff; }
.features-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
}
@media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .features-grid { grid-template-columns: 1fr; } }

.feat-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 16px; padding: 28px 24px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  cursor: default;
}
.feat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(22,119,255,0.1);
  border-color: rgba(22,119,255,0.25);
}
.feat-icon { font-size: 36px; margin-bottom: 14px; line-height: 1; }
.feat-title { font-size: 16px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.feat-desc { font-size: 13px; color: var(--text-2); line-height: 1.8; }

/* ═══ Showcase ═══ */
.showcase-section { padding: 80px 0; background: #f8fafc; border-top: 1px solid var(--border); }
.showcase-track {
  display: flex; gap: 16px; overflow-x: auto;
  scroll-snap-type: x mandatory; padding: 8px 4px 20px;
  scrollbar-width: thin; scrollbar-color: #c0d8ff transparent;
}
.showcase-track::-webkit-scrollbar { height: 4px; }
.showcase-track::-webkit-scrollbar-thumb { background: #c0d8ff; border-radius: 2px; }
.carousel-slide {
  scroll-snap-align: start; flex-shrink: 0; width: 260px;
  background: #fff; border-radius: 16px;
  border: 1px solid var(--border);
  overflow: hidden; box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}
.carousel-slide:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
.slide-img-wrap { position: relative; }
.slide-img { width: 100%; height: 160px; object-fit: cover; display: block; }
.slide-tag {
  position: absolute; top: 8px; left: 8px;
  background: rgba(22,119,255,0.88); color: #fff;
  font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 6px;
  backdrop-filter: blur(4px);
}
.slide-body { padding: 14px 16px; }
.slide-course { font-size: 14px; font-weight: 700; color: var(--text-1); margin-bottom: 6px; }
.slide-review {
  font-size: 12px; color: var(--text-2); font-style: italic; margin-bottom: 8px;
  line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.slide-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-3); }
.slide-no { color: var(--primary); font-weight: 600; }

/* ═══ Page body ═══ */
.page-body { max-width: 1200px; margin: 0 auto; padding: 64px 24px 80px; }
.section { margin-bottom: 52px; }
.section-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
.section-title { font-size: 20px; font-weight: 800; color: var(--text-1); }
.section-count {
  font-size: 12px; color: var(--text-3);
  background: #f0f2f5; padding: 2px 10px; border-radius: 100px;
}
.section-hint { font-size: 13px; color: var(--text-3); }

/* Skeleton */
.skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.skeleton-card { height: 130px; border-radius: 14px; background: linear-gradient(90deg, #f0f2f5 25%, #e8edf2 50%, #f0f2f5 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-line { height: 18px; border-radius: 6px; margin-bottom: 10px; background: linear-gradient(90deg, #f0f2f5 25%, #e8edf2 50%, #f0f2f5 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skeleton-line:last-child { width: 55%; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* Activity cards */
.activity-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
.activity-card {
  background: #fff; border-radius: 14px; padding: 22px;
  border-top: 3px solid var(--primary);
  border: 1px solid var(--border);
  border-top-width: 3px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}
.activity-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
.activity-card.type-promo { border-top-color: var(--warning); }
.activity-badge {
  display: inline-block; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 100px; margin-bottom: 10px;
}
.type-notice .activity-badge { background: var(--primary-light); color: var(--primary); }
.type-promo .activity-badge { background: #fff7e6; color: var(--warning); }
.activity-title { font-size: 15px; font-weight: 700; color: var(--text-1); margin-bottom: 8px; line-height: 1.4; }
.activity-content { font-size: 13px; color: var(--text-2); line-height: 1.8; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }

/* Two-col */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
@media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

/* Price card */
.price-card {
  background: #fff; border-radius: 16px;
  border: 1px solid var(--border); overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.price-skeleton { padding: 20px 24px; }
.price-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid #f5f7fa; cursor: pointer;
  transition: background 0.12s;
}
.price-row.last { border-bottom: none; }
.price-row:hover { background: #f0f5ff; }
.price-left { display: flex; align-items: flex-start; gap: 14px; }
.price-idx {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--primary-light); color: var(--primary);
  font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.price-name { font-size: 15px; font-weight: 600; color: var(--text-1); }
.price-desc { font-size: 12px; color: var(--text-3); margin-top: 3px; }
.price-right { display: flex; align-items: center; gap: 8px; }
.price-tag {
  background: var(--primary-light); color: var(--primary);
  font-size: 13px; font-weight: 700; padding: 5px 13px; border-radius: 8px;
}
.price-arrow { color: var(--text-3); transition: color 0.12s, transform 0.12s; }
.price-row:hover .price-arrow { color: var(--primary); transform: translateX(3px); }

/* CTA card */
.cta-card {
  background: linear-gradient(145deg, #0a1a4d 0%, #1354c5 50%, #2563eb 100%);
  border-radius: 16px; padding: 36px 30px;
  color: #fff; height: 100%;
  display: flex; flex-direction: column;
  position: relative; overflow: hidden;
}
.cta-glow {
  position: absolute; top: -60px; right: -60px;
  width: 220px; height: 220px; border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%);
  pointer-events: none;
}
.cta-icon { font-size: 36px; margin-bottom: 14px; }
.cta-title { font-size: 22px; font-weight: 800; margin-bottom: 10px; }
.cta-desc { font-size: 14px; color: rgba(255,255,255,0.72); line-height: 1.7; margin-bottom: 24px; }
.cta-steps { flex: 1; display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.cta-step { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,0.85); }
.step-n {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,255,255,0.18); font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cta-wechat { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 20px; }
.cta-wechat strong { color: #fff; }
.cta-btn {
  background: #fff; color: #1354c5;
  border: none; border-radius: 10px;
  padding: 14px; font-size: 15px; font-weight: 700;
  cursor: pointer; text-align: center;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
  transition: transform 0.15s, box-shadow 0.15s;
}
.cta-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.28); }

/* Responsive */
@media (max-width: 640px) {
  .hero-title { font-size: 40px; }
  .hero-stats { gap: 16px; }
  .stat-num { font-size: 24px; }
  .stat-line { height: 28px; }
  .page-body { padding: 40px 16px 60px; }
}
</style>
