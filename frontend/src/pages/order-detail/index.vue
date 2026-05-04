<template>
  <div class="detail-page">
    <div v-if="order" class="detail-inner">
      <!-- 面包屑 -->
      <div class="breadcrumb">
        <router-link to="/my-orders" class="bc-back">← 我的订单</router-link>
      </div>

      <div class="detail-layout">
        <!-- 主信息 -->
        <div class="main-col">
          <!-- 状态头部 -->
          <div class="status-header" :class="order.status">
            <div class="status-header-left">
              <div class="status-icon">{{ statusIcon(order.status) }}</div>
              <div>
                <div class="status-text">{{ statusLabel(order.status) }}</div>
                <div class="order-no-sm">{{ order.orderNo }}</div>
              </div>
            </div>
            <div class="created-at">{{ fmtDateTime(order.createdAt) }}</div>
          </div>

          <!-- 详情表格 -->
          <div class="info-table">
            <div class="info-row">
              <span class="info-key">课程名称</span>
              <span class="info-val bold">{{ order.courseName }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">需求类型</span>
              <span class="info-val">{{ order.orderType?.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">参考价格</span>
              <span class="info-val">{{ order.orderType?.price }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">年级</span>
              <span class="info-val">{{ gradeLabel(order.grade) }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">截止日期</span>
              <span class="info-val">{{ fmtDate(order.deadline) }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">联系微信</span>
              <span class="info-val">{{ order.contactWechat }}</span>
            </div>
            <div v-if="order.quotedPrice" class="info-row highlight">
              <span class="info-key">管理员报价</span>
              <span class="info-val price">{{ order.quotedPrice }}</span>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <aside class="side-col">
          <div class="side-card">
            <div class="side-title">💬 联系管理员</div>
            <p class="side-desc">有任何问题，请直接联系管理员微信</p>
            <div class="wechat-box" @click="copyWechat">
              <div>
                <div class="wechat-label-sm">管理员微信</div>
                <div class="wechat-id">{{ adminWechat }}</div>
              </div>
              <div class="copy-pill">复制</div>
            </div>
          </div>

          <!-- 状态历史时间线 -->
          <div class="side-card status-card">
            <div class="side-title">状态变更记录</div>
            <div v-if="order.statusHistory && order.statusHistory.length" class="timeline">
              <div v-for="(h, i) in order.statusHistory" :key="h.id"
                class="tl-item"
                :class="{ 'tl-last': i === order.statusHistory.length - 1 }">
                <div class="tl-dot" :class="i === order.statusHistory.length - 1 ? 'tl-dot-active' : 'tl-dot-done'"></div>
                <div class="tl-body">
                  <div class="tl-status">{{ statusLabel(h.toStatus) }}</div>
                  <div class="tl-time">{{ fmtDateTime(h.createdAt) }}</div>
                  <div v-if="h.remark" class="tl-remark">{{ h.remark }}</div>
                </div>
              </div>
            </div>
            <div v-else class="status-list">
              <div v-for="s in statusFlow" :key="s.key"
                class="status-node"
                :class="{ active: order.status === s.key, passed: isPassed(s.key, order.status) }">
                <div class="sn-dot"></div>
                <span>{{ s.label }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
    <div v-else class="loading-state">
      <div class="loader"></div>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../../api'

const route = useRoute()
const order = ref<any>(null)
const adminWechat = ref('Jt--04')

const statusLabels: Record<string,string> = { PENDING:'待处理', ACCEPTED:'已接单', IN_PROGRESS:'进行中', COMPLETED:'已完成', CLOSED:'已关闭' }
const gradeLabels: Record<string,string> = { FRESHMAN:'大一', SOPHOMORE:'大二', JUNIOR:'大三' }
const statusFlow = [
  { key: 'PENDING', label: '待处理' },
  { key: 'ACCEPTED', label: '已接单' },
  { key: 'IN_PROGRESS', label: '进行中' },
  { key: 'COMPLETED', label: '已完成' },
]
const flowOrder = statusFlow.map(s => s.key)

const statusLabel = (s: string) => statusLabels[s] ?? s
const gradeLabel = (g: string) => gradeLabels[g] ?? g
const fmtDate = (d: string) => new Date(d).toLocaleDateString('zh-CN')
const fmtDateTime = (d: string) => new Date(d).toLocaleString('zh-CN')
const statusIcon = (s: string) => ({ PENDING:'⏳', ACCEPTED:'✅', IN_PROGRESS:'🔨', COMPLETED:'🎉', CLOSED:'🔒' }[s] ?? '📋')
const isPassed = (key: string, current: string) => flowOrder.indexOf(key) < flowOrder.indexOf(current)

onMounted(async () => {
  try {
    const [orderRes, configRes]: any[] = await Promise.all([api.getOrder(route.params.id as string), api.getConfig()])
    order.value = orderRes.data
    if (configRes.data?.adminWechatId) adminWechat.value = configRes.data.adminWechatId
  } catch { history.back() }
})

function copyWechat() { navigator.clipboard.writeText(adminWechat.value).then(() => alert(`✅ 已复制 ${adminWechat.value}`)) }
</script>

<style scoped>
.detail-page { padding: 32px 32px 80px; background: var(--bg); min-height: calc(100vh - 64px); }
.detail-inner { max-width: 1000px; margin: 0 auto; }
.breadcrumb { margin-bottom: 20px; }
.bc-back { font-size: 14px; color: var(--text-3); transition: color 0.15s; }
.bc-back:hover { color: var(--primary); }

.detail-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
@media (max-width: 768px) { .detail-layout { grid-template-columns: 1fr; } }

/* ─── 状态头 ─── */
.status-header {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 24px 28px; display: flex; align-items: center; justify-content: space-between;
}
.PENDING.status-header  { background: #fff7e6; }
.ACCEPTED.status-header { background: var(--primary-light); }
.IN_PROGRESS.status-header { background: #e6fffb; }
.COMPLETED.status-header { background: #f6ffed; }
.CLOSED.status-header    { background: #f5f5f5; }
.status-header-left { display: flex; align-items: center; gap: 14px; }
.status-icon { font-size: 32px; }
.status-text { font-size: 20px; font-weight: 800; color: var(--text-1); }
.order-no-sm { font-size: 13px; color: var(--text-3); margin-top: 2px; font-family: monospace; }
.created-at { font-size: 13px; color: var(--text-3); }

/* ─── 详情表格 ─── */
.info-table { background: var(--card); border-radius: 0 0 var(--radius-lg) var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 28px; border-bottom: 1px solid #f5f7fa; }
.info-row:last-child { border-bottom: none; }
.info-row.highlight { background: var(--primary-light); }
.info-key { font-size: 14px; color: var(--text-3); font-weight: 500; }
.info-val { font-size: 15px; color: var(--text-1); text-align: right; }
.info-val.bold { font-weight: 700; font-size: 16px; }
.info-val.price { font-size: 22px; font-weight: 900; color: var(--primary); }

/* ─── 侧边栏 ─── */
.side-col { display: flex; flex-direction: column; gap: 16px; }
.side-card { background: var(--card); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
.side-title { font-size: 15px; font-weight: 700; color: var(--text-1); margin-bottom: 10px; }
.side-desc { font-size: 13px; color: var(--text-3); margin-bottom: 16px; }
.wechat-box { background: #f6f8fb; border-radius: var(--radius-sm); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.15s; }
.wechat-box:hover { background: var(--primary-light); }
.wechat-label-sm { font-size: 11px; color: var(--text-3); margin-bottom: 4px; }
.wechat-id { font-size: 18px; font-weight: 800; color: var(--text-1); }
.copy-pill { background: var(--primary); color: #fff; font-size: 12px; padding: 5px 12px; border-radius: 6px; }

/* 状态流程 */
.status-card { }
.status-list { display: flex; flex-direction: column; gap: 12px; margin-top: 4px; }
.status-node { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-3); }
.sn-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border); border: 2px solid var(--border); flex-shrink: 0; transition: all 0.2s; }
.status-node.passed .sn-dot { background: var(--success); border-color: var(--success); }
.status-node.passed { color: var(--text-2); }
.status-node.active .sn-dot { background: var(--primary); border-color: var(--primary); box-shadow: 0 0 0 4px rgba(22,119,255,0.2); }
.status-node.active { color: var(--primary); font-weight: 700; }

/* ─── 时间线 ─── */
.timeline { display: flex; flex-direction: column; gap: 0; margin-top: 4px; }
.tl-item { display: flex; gap: 10px; position: relative; padding-bottom: 16px; }
.tl-item.tl-last { padding-bottom: 0; }
.tl-item::before {
  content: ''; position: absolute; left: 5px; top: 14px;
  width: 2px; bottom: 0; background: var(--border);
}
.tl-last::before { display: none; }
.tl-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; z-index: 1; }
.tl-dot-done { background: var(--success); }
.tl-dot-active { background: var(--primary); box-shadow: 0 0 0 4px rgba(22,119,255,0.15); }
.tl-body { flex: 1; }
.tl-status { font-size: 14px; font-weight: 600; color: var(--text-1); }
.tl-time { font-size: 12px; color: var(--text-3); margin-top: 2px; }
.tl-remark { font-size: 12px; color: var(--text-2); margin-top: 4px; background: #f6f8fb; border-radius: 4px; padding: 4px 8px; }

/* ─── 加载 ─── */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 120px 0; color: var(--text-3); font-size: 15px; }
.loader { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
