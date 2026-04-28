<template>
  <div class="dash">

    <!-- ── 顶部核心指标 ── -->
    <div class="metrics-grid">
      <div
        v-for="card in metricCards"
        :key="card.key"
        class="metric-card"
        :style="{ '--clr': card.color, '--clr-dim': card.dim }"
      >
        <div class="mc-top">
          <el-icon class="mc-icon"><component :is="card.icon" /></el-icon>
          <span class="mc-tag" :style="{ color: card.color }">{{ card.tag }}</span>
        </div>
        <div class="mc-val">{{ displayVals[card.key] ?? '—' }}</div>
        <div class="mc-label">{{ card.label }}</div>
        <div class="mc-bar">
          <div class="mc-bar-fill" :style="{ width: barWidths[card.key] + '%' }" />
        </div>
      </div>
    </div>

    <!-- ── 订单状态分布 ── -->
    <div class="section-title">
      <span class="st-line" />
      <span>订单状态分布</span>
      <span class="st-line" />
    </div>
    <div class="status-grid">
      <div v-for="s in statusCards" :key="s.key" class="status-card" :style="{ '--sc': s.color }">
        <div class="sc-num">{{ byStatus[s.key] ?? 0 }}</div>
        <div class="sc-label">{{ s.label }}</div>
        <div class="sc-dot" />
      </div>
    </div>

    <!-- ── 快捷操作 + 最近订单 ── -->
    <div class="bottom-grid">
      <!-- 快捷操作 -->
      <div class="panel quick-panel">
        <div class="panel-hd">
          <span class="ph-icon"><el-icon><Grid /></el-icon></span>
          快捷操作
        </div>
        <div class="quick-actions">
          <button
            v-for="act in quickActions"
            :key="act.label"
            class="qa-btn"
            :style="{ '--qc': act.color }"
            @click="$router.push(act.path)"
          >
            <el-icon><component :is="act.icon" /></el-icon>
            <span>{{ act.label }}</span>
          </button>
        </div>
      </div>

      <!-- 最近订单 -->
      <div class="panel orders-panel">
        <div class="panel-hd">
          <span class="ph-icon"><el-icon><List /></el-icon></span>
          最近订单
          <span class="ph-more" @click="$router.push('/orders')">全部 →</span>
        </div>
        <div class="orders-table">
          <div class="ot-head">
            <span class="ot-c ot-no">订单号</span>
            <span class="ot-c ot-name">课程</span>
            <span class="ot-c ot-type">类型</span>
            <span class="ot-c ot-status">状态</span>
          </div>
          <div
            v-for="row in recentOrders"
            :key="row.id"
            class="ot-row"
            @click="$router.push(`/orders/${row.id}`)"
          >
            <span class="ot-c ot-no">{{ row.orderNo }}</span>
            <span class="ot-c ot-name">{{ row.courseName }}</span>
            <span class="ot-c ot-type">{{ row.orderType?.name ?? '—' }}</span>
            <span class="ot-c ot-status">
              <span class="status-dot" :class="row.status.toLowerCase()">
                {{ statusLabel(row.status) }}
              </span>
            </span>
          </div>
          <div v-if="!recentOrders.length" class="ot-empty">暂无订单数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../../api'

const statsData = ref<any>({})
const recentOrders = ref<any[]>([])

const byStatus = computed(() => statsData.value?.byStatus ?? {})

// 动态数字 counter 动画
const displayVals = ref<Record<string, number>>({})
function countUp(key: string, to: number, duration = 900) {
  const start = Date.now()
  const tick = () => {
    const p = Math.min((Date.now() - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    displayVals.value[key] = Math.round(to * eased)
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

const metricCards = computed(() => [
  {
    key: 'todayNew', label: '今日新增', tag: 'TODAY',
    icon: 'Plus', color: '#00d4ff', dim: 'rgba(0,212,255,0.12)',
    raw: statsData.value?.today?.new ?? 0,
  },
  {
    key: 'todayDone', label: '今日完成', tag: 'DONE',
    icon: 'CircleCheck', color: '#10d98a', dim: 'rgba(16,217,138,0.12)',
    raw: statsData.value?.today?.completed ?? 0,
  },
  {
    key: 'weekNew', label: '本周新增', tag: 'WEEK',
    icon: 'Calendar', color: '#a855f7', dim: 'rgba(168,85,247,0.12)',
    raw: statsData.value?.thisWeek?.new ?? 0,
  },
  {
    key: 'total', label: '累计订单', tag: 'TOTAL',
    icon: 'DataLine', color: '#f59e0b', dim: 'rgba(245,158,11,0.12)',
    raw: statsData.value?.total ?? 0,
  },
])

const barWidths = computed(() => {
  const max = Math.max(...metricCards.value.map(c => c.raw), 1)
  return Object.fromEntries(metricCards.value.map(c => [c.key, Math.round((c.raw / max) * 100)]))
})

const statusCards = [
  { key: 'PENDING',     label: '待确认', color: '#f59e0b' },
  { key: 'ACCEPTED',    label: '已接单', color: '#00d4ff' },
  { key: 'IN_PROGRESS', label: '进行中', color: '#a855f7' },
  { key: 'COMPLETED',   label: '已完成', color: '#10d98a' },
  { key: 'CLOSED',      label: '已关闭', color: '#4b5563' },
]

const quickActions = [
  { label: '处理待确认', path: '/orders?status=PENDING', icon: 'Warning',       color: '#f59e0b' },
  { label: '全部订单',   path: '/orders',                icon: 'List',          color: '#00d4ff' },
  { label: '需求类型',   path: '/order-types',           icon: 'Grid',          color: '#a855f7' },
  { label: '发布公告',   path: '/activities',            icon: 'Bell',          color: '#10d98a' },
  { label: '论坛管理',   path: '/posts',                 icon: 'ChatDotRound',  color: '#f472b6' },
  { label: '用户管理',   path: '/users',                 icon: 'User',          color: '#60a5fa' },
]

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待确认', ACCEPTED: '已接单', IN_PROGRESS: '进行中',
  COMPLETED: '已完成', CLOSED: '已关闭',
}
const statusLabel = (s: string) => STATUS_LABELS[s] ?? s

onMounted(async () => {
  const res: any = await api.getStats()
  statsData.value = res.data
  recentOrders.value = res.data?.recentOrders ?? []
  // 启动数字动画
  const keyMap: Record<string, number> = {
    todayNew: res.data?.today?.new ?? 0,
    todayDone: res.data?.today?.completed ?? 0,
    weekNew: res.data?.thisWeek?.new ?? 0,
    total: res.data?.total ?? 0,
  }
  Object.entries(keyMap).forEach(([k, v]) => countUp(k, v))
})
</script>

<style scoped>
.dash { padding: 4px 0; }

/* ─ Section title ─ */
.section-title {
  display: flex; align-items: center; gap: 12px;
  color: var(--text-lo); font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  margin: 28px 0 14px;
}
.st-line { flex: 1; height: 1px; background: var(--border); }

/* ─ Metric cards ─ */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
@media (max-width: 1100px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }

.metric-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-top: 2px solid var(--clr);
  border-radius: var(--radius);
  padding: 18px 20px 16px;
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}
.metric-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, var(--clr-dim) 0%, transparent 70%);
  pointer-events: none;
}
.metric-card:hover {
  box-shadow: 0 0 20px var(--clr-dim), 0 4px 20px rgba(0,0,0,0.4);
  transform: translateY(-2px);
}

.mc-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.mc-icon { font-size: 18px; color: var(--clr); opacity: 0.9; }
.mc-tag {
  font-size: 9px; font-weight: 800; letter-spacing: 0.18em;
  padding: 2px 7px;
  border: 1px solid currentColor;
  border-radius: 4px;
  opacity: 0.7;
}

.mc-val {
  font-size: 40px;
  font-weight: 900;
  color: var(--text-hi);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
}
.mc-label {
  font-size: 12px; color: var(--text-md);
  margin-top: 6px; margin-bottom: 14px;
}
.mc-bar {
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.mc-bar-fill {
  height: 100%;
  background: var(--clr);
  border-radius: 99px;
  transition: width 1s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 0 8px var(--clr);
}

/* ─ Status cards ─ */
.status-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
@media (max-width: 900px) { .status-grid { grid-template-columns: repeat(3, 1fr); } }

.status-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  text-align: center;
  position: relative;
  transition: border-color 0.2s;
}
.status-card:hover { border-color: var(--sc); }
.sc-num {
  font-size: 28px; font-weight: 800;
  color: var(--sc);
  font-variant-numeric: tabular-nums;
}
.sc-label { font-size: 12px; color: var(--text-md); margin-top: 4px; }
.sc-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--sc);
  margin: 10px auto 0;
  box-shadow: 0 0 8px var(--sc);
}

/* ─ Bottom grid ─ */
.bottom-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 14px;
  margin-top: 28px;
}
@media (max-width: 900px) { .bottom-grid { grid-template-columns: 1fr; } }

.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.panel-hd {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  font-size: 13px; font-weight: 600; color: var(--text-hi);
}
.ph-icon { color: var(--accent); font-size: 15px; }
.ph-more {
  margin-left: auto;
  font-size: 12px; color: var(--accent); cursor: pointer;
  opacity: 0.8; transition: opacity 0.15s;
}
.ph-more:hover { opacity: 1; }

/* Quick actions */
.quick-actions {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px; padding: 14px;
}
.qa-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-md);
  font-size: 12.5px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.18s;
}
.qa-btn .el-icon { font-size: 14px; color: var(--qc); }
.qa-btn:hover { background: rgba(0,212,255,0.06); border-color: var(--qc); color: var(--text-hi); }

/* Orders table */
.orders-table { padding: 0 18px 14px; }
.ot-head {
  display: flex;
  padding: 10px 0 6px;
  font-size: 11px; font-weight: 700;
  color: var(--text-lo); letter-spacing: 0.08em; text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}
.ot-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0,212,255,0.05);
  font-size: 13px; color: var(--text-md);
  cursor: pointer;
  transition: color 0.15s;
}
.ot-row:hover { color: var(--text-hi); }
.ot-row:last-child { border-bottom: none; }
.ot-empty { padding: 24px 0; text-align: center; color: var(--text-lo); font-size: 13px; }

.ot-c { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px; }
.ot-no    { width: 140px; flex-shrink: 0; font-family: monospace; font-size: 12px; }
.ot-name  { flex: 1; min-width: 0; }
.ot-type  { width: 80px; flex-shrink: 0; }
.ot-status { width: 80px; flex-shrink: 0; }

.status-dot {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255,255,255,0.05);
}
.status-dot.pending     { color: #f59e0b; background: rgba(245,158,11,0.12); }
.status-dot.accepted    { color: #00d4ff; background: rgba(0,212,255,0.12); }
.status-dot.in_progress { color: #a855f7; background: rgba(168,85,247,0.12); }
.status-dot.completed   { color: #10d98a; background: rgba(16,217,138,0.12); }
.status-dot.closed      { color: #6b7280; background: rgba(107,114,128,0.12); }
</style>
