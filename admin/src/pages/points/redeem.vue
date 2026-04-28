<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>兑换订单审核</h2>
      <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width:140px" @change="loadOrders">
        <el-option label="待审核" value="PENDING" />
        <el-option label="已完成" value="COMPLETED" />
        <el-option label="已拒绝" value="REJECTED" />
      </el-select>
    </div>

    <el-table :data="orders" v-loading="loading">
      <el-table-column prop="user.nickname" label="用户" width="120" />
      <el-table-column prop="user.username" label="用户名" width="120" />
      <el-table-column prop="shopItem.name" label="商品" min-width="160" />
      <el-table-column prop="shopItem.type" label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="row.shopItem.type === 'COUPON' ? 'warning' : 'primary'" size="small">
            {{ row.shopItem.type === 'COUPON' ? '折扣券' : '套餐' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="pointsCost" label="积分" width="90" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="adminNote" label="备注" min-width="120" />
      <el-table-column label="申请时间" width="140">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'PENDING'">
            <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" @click="openReject(row)">拒绝</el-button>
          </template>
          <span v-else class="handled-text">已处理</span>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > pageSize"
      class="pagination"
      :total="total"
      :page-size="pageSize"
      v-model:current-page="currentPage"
      @current-change="loadOrders"
      layout="prev, pager, next"
    />

    <!-- 拒绝弹窗 -->
    <el-dialog v-model="rejectDialog" title="拒绝原因" width="400px">
      <el-input v-model="rejectNote" type="textarea" :rows="3" placeholder="请填写拒绝原因（必填）" />
      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="danger" :loading="operating" @click="submitReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const orders = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = 20
const statusFilter = ref('')
const operating = ref(false)
const rejectDialog = ref(false)
const rejectTarget = ref<any>(null)
const rejectNote = ref('')

function statusLabel(s: string) {
  return { PENDING: '待审核', COMPLETED: '已完成', REJECTED: '已拒绝' }[s] ?? s
}
function statusType(s: string) {
  return { PENDING: 'warning', COMPLETED: 'success', REJECTED: 'danger' }[s] ?? 'info'
}
function formatDate(d: string) {
  return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadOrders() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize }
    if (statusFilter.value) params.status = statusFilter.value
    const res: any = await api.getRedeemOrders(params)
    orders.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function handleApprove(row: any) {
  operating.value = true
  try {
    await api.approveRedeem(row.id)
    ElMessage.success('已通过，积分已扣减')
    loadOrders()
  } catch (err: any) {
    ElMessage.error(err?.message ?? '操作失败')
  } finally {
    operating.value = false
  }
}

function openReject(row: any) {
  rejectTarget.value = row
  rejectNote.value = ''
  rejectDialog.value = true
}

async function submitReject() {
  if (!rejectNote.value.trim()) return ElMessage.warning('请填写拒绝原因')
  operating.value = true
  try {
    await api.rejectRedeem(rejectTarget.value.id, rejectNote.value.trim())
    ElMessage.success('已拒绝，积分已解冻')
    rejectDialog.value = false
    loadOrders()
  } catch (err: any) {
    ElMessage.error(err?.message ?? '操作失败')
  } finally {
    operating.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.admin-page { padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 1.4rem; font-weight: 700; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.handled-text { font-size: 0.8rem; color: var(--el-text-color-placeholder); }
</style>
