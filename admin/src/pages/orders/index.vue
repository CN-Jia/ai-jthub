<template>
  <!-- 状态汇总条 -->
  <el-row :gutter="12" style="margin-bottom:16px">
    <el-col v-for="s in statusOptions" :key="s.value" :span="24 / statusOptions.length">
      <el-card shadow="hover" class="stat-mini" @click="quickFilter(s.value)" style="cursor:pointer">
        <div class="stat-mini-val" :style="{ color: s.color }">{{ orderStats[s.value] ?? '-' }}</div>
        <div class="stat-mini-label">{{ s.label }}</div>
      </el-card>
    </el-col>
  </el-row>

  <el-card>
    <template #header>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
        <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:140px" @change="loadOrders">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="搜索订单号/课程/微信" style="width:220px"
          @keyup.enter="loadOrders" clearable @clear="loadOrders" />
        <el-button type="primary" @click="loadOrders">搜索</el-button>
      </div>
    </template>

    <el-table :data="orders" stripe v-loading="loading"
      @row-click="row => $router.push(`/orders/${row.id}`)" style="cursor:pointer">
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column prop="courseName" label="课程名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="需求类型" width="120">
        <template #default="{ row }">{{ row.orderType?.name ?? '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="来源" width="90">
        <template #default="{ row }">{{ row.source === 'MINIPROGRAM' ? '小程序' : 'PC' }}</template>
      </el-table-column>
      <el-table-column prop="contactWechat" label="联系微信" width="140" />
      <el-table-column label="截止日期" width="110">
        <template #default="{ row }">{{ fmtDate(row.deadline) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="110">
        <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
      :total="total" layout="total, prev, pager, next" style="margin-top:16px;justify-content:flex-end;display:flex"
      @current-change="loadOrders" />
  </el-card>
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
  { value: 'PENDING', label: '待确认', color: '#fa8c16' },
  { value: 'ACCEPTED', label: '已接单', color: '#1677ff' },
  { value: 'IN_PROGRESS', label: '进行中', color: '#13c2c2' },
  { value: 'COMPLETED', label: '已完成', color: '#52c41a' },
  { value: 'CLOSED', label: '已关闭', color: '#999' },
]

function quickFilter(status: string) {
  filters.status = filters.status === status ? '' : status
  page.value = 1
  loadOrders()
}
const statusLabel = (s: string) => statusOptions.find(o => o.value === s)?.label ?? s
const statusType = (s: string) => (
  ({ PENDING: 'warning', ACCEPTED: 'primary', IN_PROGRESS: '', COMPLETED: 'success', CLOSED: 'info' } as any)[s] ?? ''
)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('zh-CN')

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
.stat-mini { text-align: center; transition: box-shadow 0.15s; }
.stat-mini:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; }
.stat-mini-val { font-size: 28px; font-weight: bold; }
.stat-mini-label { font-size: 12px; color: #666; margin-top: 4px; }
</style>
