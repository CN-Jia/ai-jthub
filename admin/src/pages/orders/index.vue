<template>
  <div class="sf-page">
    <!-- 状态汇总卡 -->
    <div class="status-bar">
      <div
        v-for="s in statusOptions" :key="s.value"
        class="sbar-item"
        :class="{ active: filters.status === s.value }"
        :style="{ '--sc': s.color }"
        @click="quickFilter(s.value)"
      >
        <span class="sbar-num">{{ orderStats[s.value] ?? 0 }}</span>
        <span class="sbar-label">{{ s.label }}</span>
      </div>
    </div>

    <!-- 主面板 -->
    <div class="sf-panel">
      <div class="sf-panel-hd">
        <div class="sf-toolbar-left">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:130px" @change="loadOrders">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
          <el-input v-model="filters.keyword" placeholder="订单号 / 课程 / 微信" style="width:220px"
            @keyup.enter="loadOrders" clearable @clear="loadOrders">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="loadOrders">搜索</el-button>
        </div>
      </div>

      <el-table
        :data="orders"
        v-loading="loading"
        @row-click="row => $router.push(`/orders/${row.id}`)"
        style="cursor:pointer;width:100%"
      >
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="courseName" label="课程名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="需求类型" width="120">
          <template #default="{ row }">{{ row.orderType?.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contactWechat" label="联系微信" width="140" />
        <el-table-column label="截止日期" width="110">
          <template #default="{ row }">{{ fmtDate(row.deadline) }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="110">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>

      <div class="sf-pagination">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :total="total" layout="total, prev, pager, next"
          @current-change="loadOrders" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { api } from '../../api'

const orders = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ status: '', keyword: '' })
const orderStats = ref<Record<string, number>>({})

const statusOptions = [
  { value: 'PENDING',     label: '待确认', color: '#00d4ff' },
  { value: 'ACCEPTED',    label: '已接单', color: '#00d4ff' },
  { value: 'IN_PROGRESS', label: '进行中', color: '#00d4ff' },
  { value: 'COMPLETED',   label: '已完成', color: '#00d4ff' },
  { value: 'CLOSED',      label: '已关闭', color: '#00d4ff' },
]

function quickFilter(status: string) {
  filters.status = filters.status === status ? '' : status
  page.value = 1
  loadOrders()
}

const statusLabel = (s: string) => statusOptions.find(o => o.value === s)?.label ?? s
const statusTag = (s: string) => (
  { PENDING: 'warning', ACCEPTED: 'primary', IN_PROGRESS: '', COMPLETED: 'success', CLOSED: 'info' } as any
)[s] ?? ''
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('zh-CN') : '—'

async function loadOrders() {
  loading.value = true
  try {
    const res: any = await api.getOrders({
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      page: page.value,
      pageSize: pageSize.value,
    })
    orders.value = res.data.list
    total.value = res.data.total
    if (res.data.stats) orderStats.value = res.data.stats
  } finally { loading.value = false }
}

onMounted(loadOrders)
</script>

<style scoped>
.status-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.sbar-item {
  background: #0d1b2e;
  border: 1px solid rgba(0,212,255,0.1);
  border-radius: 10px;
  padding: 14px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.18s;
}
.sbar-item:hover { border-color: var(--sc); background: rgba(0,212,255,0.04); }
.sbar-item.active { border-color: var(--sc); background: rgba(0,212,255,0.07); }
.sbar-num  { display: block; font-size: 28px; font-weight: 800; color: var(--sc); font-variant-numeric: tabular-nums; }
.sbar-label { font-size: 12px; color: var(--text-md, #7fa5c0); margin-top: 3px; display: block; }
</style>
