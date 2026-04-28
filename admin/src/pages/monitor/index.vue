<template>
  <div class="monitor-page">
    <!-- 顶栏 -->
    <div class="monitor-header">
      <div class="monitor-title-row">
        <h2>系统监控</h2>
        <div class="header-right">
          <span class="update-time" v-if="lastUpdate">最后更新 {{ lastUpdate }}</span>
          <el-select v-model="timeRange" style="width:120px" size="small" @change="fetchChartData">
            <el-option label="近 30 分钟" :value="30" />
            <el-option label="近 1 小时" :value="60" />
            <el-option label="近 3 小时" :value="180" />
            <el-option label="近 6 小时" :value="360" />
          </el-select>
          <el-button size="small" :loading="loading" @click="loadAll">刷新</el-button>
        </div>
      </div>

      <!-- Prometheus 不可用提示 -->
      <el-alert
        v-if="status && !status.promAvailable"
        type="warning"
        show-icon
        :closable="false"
        style="margin-top:12px"
      >
        <template #title>
          Prometheus 未连接，CPU/磁盘/网络历史数据不可用。内存/负载数据来自 Node.js os 模块。
          <a href="#install" style="margin-left:8px;color:inherit;font-weight:600">查看安装文档 ↓</a>
        </template>
      </el-alert>
    </div>

    <!-- 指标卡片 -->
    <div class="metric-cards" v-if="status">
      <div class="metric-card" :class="cpuClass">
        <div class="mc-icon">🖥</div>
        <div class="mc-body">
          <div class="mc-value">
            {{ status.cpu.usagePct !== null ? status.cpu.usagePct.toFixed(1) + '%' : '—' }}
          </div>
          <div class="mc-label">CPU 使用率</div>
          <div class="mc-sub">{{ status.cpu.cores }} 核 · 负载 {{ status.cpu.load1?.toFixed(2) }}</div>
        </div>
        <div class="mc-gauge">
          <svg viewBox="0 0 36 36" class="gauge-svg">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="3"
              stroke-dasharray="100 100"
              :stroke-dashoffset="100 - Math.min(100, status.cpu.usagePct ?? 0)"
              stroke-linecap="round"
              transform="rotate(-90 18 18)" />
          </svg>
        </div>
      </div>

      <div class="metric-card" :class="memClass">
        <div class="mc-icon">💾</div>
        <div class="mc-body">
          <div class="mc-value">{{ status.memory.usedPct }}%</div>
          <div class="mc-label">内存使用率</div>
          <div class="mc-sub">{{ fmtBytes(status.memory.usedBytes) }} / {{ fmtBytes(status.memory.totalBytes) }}</div>
        </div>
        <div class="mc-gauge">
          <svg viewBox="0 0 36 36" class="gauge-svg">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="3"
              stroke-dasharray="100 100"
              :stroke-dashoffset="100 - status.memory.usedPct"
              stroke-linecap="round"
              transform="rotate(-90 18 18)" />
          </svg>
        </div>
      </div>

      <div class="metric-card" :class="diskClass">
        <div class="mc-icon">🗄</div>
        <div class="mc-body">
          <div class="mc-value">
            {{ status.disk.usedPct !== null ? status.disk.usedPct + '%' : '—' }}
          </div>
          <div class="mc-label">磁盘使用率（/）</div>
          <div class="mc-sub">
            {{ status.disk.usedBytes ? fmtBytes(status.disk.usedBytes) : '—' }}
            / {{ status.disk.totalBytes ? fmtBytes(status.disk.totalBytes) : '—' }}
          </div>
        </div>
        <div class="mc-gauge">
          <svg viewBox="0 0 36 36" class="gauge-svg">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" stroke-width="3"
              stroke-dasharray="100 100"
              :stroke-dashoffset="100 - Math.min(100, status.disk.usedPct ?? 0)"
              stroke-linecap="round"
              transform="rotate(-90 18 18)" />
          </svg>
        </div>
      </div>

      <div class="metric-card card-net">
        <div class="mc-icon">🌐</div>
        <div class="mc-body">
          <div class="mc-value" style="font-size:1.1rem">
            ↑ {{ status.network.txBytesPerSec !== null ? fmtSpeed(status.network.txBytesPerSec) : '—' }}
          </div>
          <div class="mc-label">网络 出/入</div>
          <div class="mc-sub">
            ↓ {{ status.network.rxBytesPerSec !== null ? fmtSpeed(status.network.rxBytesPerSec) : '—' }}
          </div>
        </div>
      </div>

      <!-- 业务指标 -->
      <div class="metric-card card-biz">
        <div class="mc-icon">📦</div>
        <div class="mc-body">
          <div class="mc-value">{{ status.business.todayOrders }}</div>
          <div class="mc-label">今日新增订单</div>
          <div class="mc-sub">待处理 {{ status.business.pendingOrders }} 单</div>
        </div>
      </div>

      <div class="metric-card card-biz">
        <div class="mc-icon">👥</div>
        <div class="mc-body">
          <div class="mc-value">{{ status.business.totalUsers }}</div>
          <div class="mc-label">注册用户总数</div>
          <div class="mc-sub">累计订单 {{ status.business.totalOrders }} 单</div>
        </div>
      </div>

      <div class="metric-card card-biz">
        <div class="mc-icon">⏱</div>
        <div class="mc-body">
          <div class="mc-value" style="font-size:1rem">{{ status.os.uptimeHuman }}</div>
          <div class="mc-label">系统运行时长</div>
          <div class="mc-sub">{{ status.os.hostname }} · {{ status.os.platform }}</div>
        </div>
      </div>

      <div class="metric-card card-biz">
        <div class="mc-icon">🔗</div>
        <div class="mc-body">
          <div class="mc-value">{{ status.process.tcpConns ?? '—' }}</div>
          <div class="mc-label">TCP 连接数</div>
          <div class="mc-sub">
            打开文件 {{ status.process.openFiles ?? '—' }} 个
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div v-if="chartLoading" class="chart-loading">图表加载中…</div>
    <div class="charts-grid" v-if="chartReady && !chartLoading">
      <div class="chart-card" v-if="status?.promAvailable">
        <div class="chart-title">CPU 使用率趋势 (%)</div>
        <div ref="cpuChartRef" class="chart-canvas" />
      </div>
      <div class="chart-card" v-if="status?.promAvailable">
        <div class="chart-title">内存使用率趋势 (%)</div>
        <div ref="memChartRef" class="chart-canvas" />
      </div>
      <div class="chart-card" v-if="status?.promAvailable">
        <div class="chart-title">网络流量趋势 (KB/s)</div>
        <div ref="netChartRef" class="chart-canvas" />
      </div>
      <!-- 负载折线图（无论是否 Prometheus 可用，用 Node.js loadavg 补充）-->
      <div class="chart-card">
        <div class="chart-title">系统负载（Load Average）</div>
        <div ref="loadChartRef" class="chart-canvas" />
      </div>
    </div>

    <!-- 服务器信息表 -->
    <el-card class="info-card" v-if="status">
      <template #header>服务器基本信息</template>
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="主机名">{{ status.os.hostname }}</el-descriptions-item>
        <el-descriptions-item label="系统">{{ status.os.platform }} / {{ status.os.arch }}</el-descriptions-item>
        <el-descriptions-item label="CPU 型号">{{ status.os.cpuModel }}</el-descriptions-item>
        <el-descriptions-item label="CPU 核心">{{ status.os.cpuCount }} 核</el-descriptions-item>
        <el-descriptions-item label="系统运行时长">{{ status.os.uptimeHuman }}</el-descriptions-item>
        <el-descriptions-item label="负载（1/5/15 min）">
          {{ status.cpu.load1?.toFixed(2) }} / {{ status.cpu.load5?.toFixed(2) }} / {{ status.os.loadAvg[2]?.toFixed(2) }}
        </el-descriptions-item>
        <el-descriptions-item label="API 进程运行">{{ fmtUptime(status.process.nodeUptime) }}</el-descriptions-item>
        <el-descriptions-item label="待审核兑换">{{ status.business.pendingRedeems }} 个</el-descriptions-item>
        <el-descriptions-item label="Prometheus">
          <el-tag :type="status.promAvailable ? 'success' : 'warning'" size="small">
            {{ status.promAvailable ? '已连接' : '未连接' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 安装文档 -->
    <el-card id="install" class="info-card" v-if="status && !status.promAvailable">
      <template #header>Prometheus + Grafana 安装指引（Ubuntu 24 LTS）</template>
      <el-alert type="info" :closable="false" style="margin-bottom:12px">
        安装后刷新本页即可获取完整图表数据。
      </el-alert>
      <pre class="install-code">{{ installDocs }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { api } from '../../api'

const status = ref<any>(null)
const chartData = ref<any>(null)
const loading = ref(false)
const lastUpdate = ref('')
const timeRange = ref(60)
const chartReady = ref(false)
const chartLoading = ref(false)

const cpuChartRef = ref<HTMLElement>()
const memChartRef = ref<HTMLElement>()
const netChartRef = ref<HTMLElement>()
const loadChartRef = ref<HTMLElement>()

let cpuChart: echarts.ECharts | null = null
let memChart: echarts.ECharts | null = null
let netChart: echarts.ECharts | null = null
let loadChart: echarts.ECharts | null = null
let refreshTimer: number | null = null
const cpuClass = computed(() => {
  const v = status.value?.cpu.usagePct
  if (v === null || v === undefined) return 'card-neutral'
  if (v >= 85) return 'card-danger'
  if (v >= 65) return 'card-warning'
  return 'card-success'
})
const memClass = computed(() => {
  const v = status.value?.memory.usedPct
  if (v >= 85) return 'card-danger'
  if (v >= 70) return 'card-warning'
  return 'card-success'
})
const diskClass = computed(() => {
  const v = status.value?.disk.usedPct
  if (v === null || v === undefined) return 'card-neutral'
  if (v >= 90) return 'card-danger'
  if (v >= 75) return 'card-warning'
  return 'card-success'
})

function fmtBytes(bytes: number): string {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB'
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
  return (bytes / 1e3).toFixed(0) + ' KB'
}
function fmtSpeed(bps: number): string {
  if (bps >= 1e6) return (bps / 1e6).toFixed(1) + ' MB/s'
  if (bps >= 1e3) return (bps / 1e3).toFixed(1) + ' KB/s'
  return bps.toFixed(0) + ' B/s'
}
function fmtUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}小时 ${m}分钟`
}

const CHART_THEME = {
  bg: 'transparent',
  grid: 'rgba(255,255,255,.06)',
  text: '#94a3b8',
  line1: '#3b82f6',
  line2: '#22c55e',
  area1: 'rgba(59,130,246,.15)',
  area2: 'rgba(34,197,94,.15)',
}

function buildLineOption(
  series: Array<{ name: string; data: [number, number][]; color: string; areaColor: string }>,
  yMax?: number,
): echarts.EChartsOption {
  return {
    backgroundColor: CHART_THEME.bg,
    grid: { top: 24, right: 16, bottom: 32, left: 48 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params: any) => {
        const time = new Date(params[0].value[0]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        return params.map((p: any) => `${time}<br/>${p.marker}${p.seriesName}: <b>${p.value[1].toFixed(1)}</b>`).join('<br/>')
      },
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: CHART_THEME.grid } },
      axisLabel: {
        color: CHART_THEME.text,
        fontSize: 11,
        formatter: (val: number) => {
          const d = new Date(val)
          return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
        },
        maxTicksLimit: 6,
        hideOverlap: true,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      max: yMax,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: CHART_THEME.grid } },
      axisLabel: { color: CHART_THEME.text, fontSize: 11 },
    },
    series: series.map(s => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      symbol: 'none',
      lineStyle: { color: s.color, width: 2 },
      areaStyle: { color: s.areaColor },
      itemStyle: { color: s.color },
    })),
    legend: series.length > 1 ? {
      top: 2, right: 8,
      textStyle: { color: CHART_THEME.text, fontSize: 11 },
    } : undefined,
  }
}

async function loadStatus() {
  try {
    const res: any = await api.getSystemStatus()
    status.value = res.data
    lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
  } catch {}
}

async function fetchChartData() {
  if (!status.value) return
  chartLoading.value = true
  try {
    const res: any = await api.getSystemChart(timeRange.value)
    chartData.value = res.data
    chartReady.value = true
    await nextTick()
    renderCharts()
  } catch {
  } finally {
    chartLoading.value = false
  }
}

function renderCharts() {
  if (!chartData.value) return

  const d = chartData.value

  // CPU 图
  if (cpuChartRef.value && d.cpu.length > 0) {
    cpuChart?.dispose()
    cpuChart = echarts.init(cpuChartRef.value)
    cpuChart.setOption(buildLineOption([
      { name: 'CPU %', data: d.cpu, color: CHART_THEME.line1, areaColor: CHART_THEME.area1 },
    ], 100))
  }

  // 内存图
  if (memChartRef.value && d.memory.length > 0) {
    memChart?.dispose()
    memChart = echarts.init(memChartRef.value)
    memChart.setOption(buildLineOption([
      { name: '内存 %', data: d.memory, color: CHART_THEME.line2, areaColor: CHART_THEME.area2 },
    ], 100))
  }

  // 网络图（KB/s）
  if (netChartRef.value && (d.netRx.length > 0 || d.netTx.length > 0)) {
    netChart?.dispose()
    netChart = echarts.init(netChartRef.value)
    netChart.setOption(buildLineOption([
      { name: '入 KB/s', data: d.netRx.map(([t, v]: [number, number]) => [t, v / 1024]), color: CHART_THEME.line2, areaColor: CHART_THEME.area2 },
      { name: '出 KB/s', data: d.netTx.map(([t, v]: [number, number]) => [t, v / 1024]), color: '#f59e0b', areaColor: 'rgba(245,158,11,.12)' },
    ]))
  }

  // 负载图（使用静态当前值，若 Prometheus 有数据则覆盖）
  if (loadChartRef.value && status.value) {
    loadChart?.dispose()
    loadChart = echarts.init(loadChartRef.value)
    // 若无时序数据，用当前值生成简单横线占位
    const now = Date.now()
    const l1 = status.value.cpu.load1 ?? 0
    const l5 = status.value.cpu.load5 ?? 0
    const l15 = status.value.os.loadAvg[2] ?? 0
    const pts = (v: number) => Array.from({ length: 10 }, (_, i) => [now - (9 - i) * 60000, v])
    loadChart.setOption(buildLineOption([
      { name: 'load1', data: pts(l1), color: CHART_THEME.line1, areaColor: CHART_THEME.area1 },
      { name: 'load5', data: pts(l5), color: CHART_THEME.line2, areaColor: CHART_THEME.area2 },
      { name: 'load15', data: pts(l15), color: '#f59e0b', areaColor: 'rgba(245,158,11,.12)' },
    ]))
  }
}

async function loadAll() {
  loading.value = true
  await Promise.all([loadStatus(), fetchChartData()])
  loading.value = false
}

const installDocs = `# 1. 安装 node_exporter（采集系统指标）
wget https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-*.linux-amd64.tar.gz
tar xvf node_exporter-*.tar.gz && sudo cp node_exporter-*/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
[Service]
User=node_exporter
ExecStart=/usr/local/bin/node_exporter
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now node_exporter

# 2. 安装 Prometheus
wget https://github.com/prometheus/prometheus/releases/latest/download/prometheus-*.linux-amd64.tar.gz
tar xvf prometheus-*.tar.gz && sudo cp prometheus-*/prometheus /usr/local/bin/
# 配置 scrape
cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
EOF
sudo systemctl enable --now prometheus

# 3. 在后端 .env 中确认（默认即可）
PROMETHEUS_URL=http://localhost:9090

# 4. 重启后端
pm2 restart jthub-api --update-env`

onMounted(() => {
  loadAll()
  refreshTimer = window.setInterval(loadAll, 30000)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('resize', onResize)
  cpuChart?.dispose()
  memChart?.dispose()
  netChart?.dispose()
  loadChart?.dispose()
})

function onResize() {
  cpuChart?.resize()
  memChart?.resize()
  netChart?.resize()
  loadChart?.resize()
}
</script>

<style scoped>
.monitor-page { display: flex; flex-direction: column; gap: 16px; }

.monitor-header { }
.monitor-title-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.monitor-title-row h2 { font-size: 1.1rem; font-weight: 700; color: #e8f0fe; }
.header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.update-time { font-size: 11px; color: #3d5a70; }

/* 指标卡片 */
.metric-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.metric-card {
  background: #0d1b2e;
  border: 1px solid rgba(0,212,255,0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex; align-items: center; gap: 12px;
  position: relative; overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.metric-card:hover { box-shadow: 0 0 16px rgba(0,212,255,0.08); }

.card-success { border-top: 2px solid #10d98a; color: #10d98a; }
.card-success::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(16,217,138,0.06) 0%, transparent 70%); pointer-events: none; }
.card-warning { border-top: 2px solid #f59e0b; color: #f59e0b; }
.card-warning::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%); pointer-events: none; }
.card-danger  { border-top: 2px solid #ef4444; color: #ef4444; }
.card-danger::before  { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 70%); pointer-events: none; }
.card-neutral { border-top: 2px solid rgba(0,212,255,0.3); color: #7fa5c0; }
.card-net     { border-top: 2px solid #a855f7; color: #a855f7; }
.card-net::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 70%); pointer-events: none; }
.card-biz     { border-top: 2px solid rgba(0,212,255,0.25); color: #00d4ff; }
.card-biz::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.05) 0%, transparent 70%); pointer-events: none; }

.mc-icon { font-size: 1.4rem; flex-shrink: 0; opacity: 0.9; }
.mc-body { flex: 1; min-width: 0; }
.mc-value { font-size: 1.4rem; font-weight: 800; line-height: 1.2; font-variant-numeric: tabular-nums; }
.mc-label { font-size: 11px; color: #4d6a82; margin-top: 3px; letter-spacing: 0.04em; }
.mc-sub   { font-size: 11px; color: #3d5a70; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mc-gauge { width: 44px; height: 44px; flex-shrink: 0; }
.gauge-svg { width: 100%; height: 100%; }
.gauge-svg circle:last-child { transition: stroke-dashoffset .4s ease; }

/* 图表区 */
.charts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 12px; }
.chart-card {
  background: #0d1b2e;
  border: 1px solid rgba(0,212,255,0.1);
  border-radius: 12px;
  padding: 16px;
}
.chart-title { font-size: 11px; font-weight: 700; color: #4d6a82; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
.chart-canvas { height: 180px; }

.info-card { }
.chart-loading { text-align: center; padding: 32px; color: #4d6a82; font-size: 13px; background: #0d1b2e; border-radius: 12px; border: 1px solid rgba(0,212,255,0.1); }

.install-code {
  background: #030711;
  border-radius: 8px;
  padding: 16px;
  font-size: 12px;
  line-height: 1.7;
  color: #7fa5c0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid rgba(0,212,255,0.08);
}

@media (max-width: 768px) {
  .metric-cards { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
}
</style>
