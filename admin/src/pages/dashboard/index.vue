<template>
  <div>
    <!-- 今日 / 本周 统计 -->
    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6" v-for="card in topCards" :key="card.label">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" :style="{ color: card.color }">{{ card.val }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 各状态分布 -->
    <el-row :gutter="16" style="margin-bottom:24px">
      <el-col :span="24/5" v-for="s in statusCards" :key="s.key">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" :style="{ color: s.color }">{{ byStatus[s.key] ?? '-' }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- 快捷操作 -->
      <el-col :span="10">
        <el-card>
          <template #header><span>快捷操作</span></template>
          <el-space wrap>
            <el-button type="primary" @click="$router.push('/orders?status=PENDING')">处理待确认订单</el-button>
            <el-button @click="$router.push('/orders')">查看全部订单</el-button>
            <el-button @click="$router.push('/order-types')">管理需求类型</el-button>
            <el-button @click="$router.push('/activities')">发布活动公告</el-button>
          </el-space>
        </el-card>
      </el-col>

      <!-- 最近 5 条订单 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>最近订单</span>
              <el-button link @click="$router.push('/orders')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" size="small" @row-click="row => $router.push(`/orders/${row.id}`)" style="cursor:pointer">
            <el-table-column prop="orderNo" label="订单号" width="160" />
            <el-table-column prop="courseName" label="课程" show-overflow-tooltip />
            <el-table-column label="类型" width="90">
              <template #default="{ row }">{{ row.orderType?.name ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../../api'

const statsData = ref<any>({})
const recentOrders = ref<any[]>([])

const byStatus = computed(() => statsData.value?.byStatus ?? {})

const topCards = computed(() => [
  { label: '今日新增', val: statsData.value?.today?.new ?? '-', color: '#1677ff' },
  { label: '今日完成', val: statsData.value?.today?.completed ?? '-', color: '#52c41a' },
  { label: '本周新增', val: statsData.value?.thisWeek?.new ?? '-', color: '#13c2c2' },
  { label: '累计订单', val: statsData.value?.total ?? '-', color: '#722ed1' },
])

const statusCards = [
  { key: 'PENDING', label: '待确认', color: '#fa8c16' },
  { key: 'ACCEPTED', label: '已接单', color: '#1677ff' },
  { key: 'IN_PROGRESS', label: '进行中', color: '#13c2c2' },
  { key: 'COMPLETED', label: '已完成', color: '#52c41a' },
  { key: 'CLOSED', label: '已关闭', color: '#999' },
]

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待确认', ACCEPTED: '已接单', IN_PROGRESS: '进行中', COMPLETED: '已完成', CLOSED: '已关闭',
}
const statusLabel = (s: string) => STATUS_LABELS[s] ?? s
const statusType = (s: string) => (
  ({ PENDING: 'warning', ACCEPTED: 'primary', IN_PROGRESS: '', COMPLETED: 'success', CLOSED: 'info' } as any)[s] ?? ''
)

onMounted(async () => {
  const res: any = await api.getStats()
  statsData.value = res.data
  recentOrders.value = res.data?.recentOrders ?? []
})
</script>

<style scoped>
.stat-card { text-align:center; padding:8px 0; }
.stat-value { font-size:36px; font-weight:bold; }
.stat-label { color:#666; margin-top:4px; font-size:13px; }
</style>
