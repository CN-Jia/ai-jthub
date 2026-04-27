<template>
  <div v-if="order">
    <el-row :gutter="20">
      <!-- 左侧订单信息 -->
      <el-col :span="16">
        <el-card style="margin-bottom:16px">
          <template #header>
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-weight:bold">{{ order.orderNo }}</span>
              <el-tag :type="statusType(order.status)">{{ statusLabel(order.status) }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="课程名称">{{ order.courseName }}</el-descriptions-item>
            <el-descriptions-item label="需求类型">{{ order.orderType?.name }}</el-descriptions-item>
            <el-descriptions-item label="参考价格">{{ order.orderType?.price }}</el-descriptions-item>
            <el-descriptions-item label="年级">{{ gradeLabel(order.grade) }}</el-descriptions-item>
            <el-descriptions-item label="截止日期">{{ fmtDate(order.deadline) }}</el-descriptions-item>
            <el-descriptions-item label="联系微信">{{ order.contactWechat }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{ order.source === 'MINIPROGRAM' ? '小程序' : 'PC' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ fmtDateTime(order.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="管理员报价" v-if="order.quotedPrice">
              <span style="color:#1677ff;font-weight:bold">{{ order.quotedPrice }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 状态历史 -->
        <el-card>
          <template #header>状态变更历史</template>
          <el-timeline>
            <el-timeline-item
              v-for="h in order.statusHistory"
              :key="h.id"
              :timestamp="fmtDateTime(h.createdAt)"
              placement="top"
            >
              <div>
                <el-tag size="small" :type="statusType(h.toStatus)">{{ statusLabel(h.toStatus) }}</el-tag>
                <span v-if="h.remark" style="margin-left:8px;color:#888;font-size:13px">{{ h.remark }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 右侧操作 -->
      <el-col :span="8">
        <!-- 更新状态 -->
        <el-card style="margin-bottom:16px">
          <template #header>更新状态</template>
          <el-select v-model="newStatus" placeholder="选择新状态" style="width:100%;margin-bottom:12px">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
          <el-input v-model="remark" placeholder="备注（可选）" style="margin-bottom:12px" />
          <el-button type="primary" style="width:100%" @click="doUpdateStatus" :loading="statusLoading">
            确认更新
          </el-button>
        </el-card>

        <!-- 设置报价 -->
        <el-card style="margin-bottom:16px">
          <template #header>设置报价</template>
          <el-input v-model="quotedPrice" placeholder="如：500元" style="margin-bottom:12px" />
          <el-button type="primary" style="width:100%" @click="doSetQuote" :loading="quoteLoading">
            确认报价
          </el-button>
        </el-card>

        <!-- 内部备注 -->
        <el-card>
          <template #header>内部备注</template>
          <el-input v-model="adminNote" type="textarea" :rows="4" placeholder="添加内部备注（用户不可见）" style="margin-bottom:12px" />
          <el-button style="width:100%" @click="doAddNote" :loading="noteLoading">保存备注</el-button>
          <div v-if="order.adminNote" style="margin-top:12px;padding:8px;background:#f5f5f5;border-radius:4px;font-size:13px;color:#555">
            当前备注：{{ order.adminNote }}
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <div v-else-if="loading" style="text-align:center;padding:60px">
    <el-text>加载中...</el-text>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const route = useRoute()
const order = ref<any>(null)
const loading = ref(true)
const newStatus = ref('')
const remark = ref('')
const adminNote = ref('')
const quotedPrice = ref('')
const statusLoading = ref(false)
const noteLoading = ref(false)
const quoteLoading = ref(false)

const statusOptions = [
  { value: 'ACCEPTED', label: '已接单' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CLOSED', label: '已关闭' },
]
const statusLabel = (s: string) => (
  ({ PENDING: '待确认', ACCEPTED: '已接单', IN_PROGRESS: '进行中', COMPLETED: '已完成', CLOSED: '已关闭' } as any)[s] ?? s
)
const statusType = (s: string) => (
  ({ PENDING: 'warning', ACCEPTED: 'primary', IN_PROGRESS: '', COMPLETED: 'success', CLOSED: 'info' } as any)[s] ?? ''
)
const gradeLabel = (g: string) => ({ FRESHMAN: '大一', SOPHOMORE: '大二', JUNIOR: '大三' }[g as any] ?? g)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('zh-CN')
const fmtDateTime = (d: string) => new Date(d).toLocaleString('zh-CN')

async function loadOrder() {
  loading.value = true
  try {
    const res: any = await api.getOrder(route.params.id as string)
    order.value = res.data
    adminNote.value = res.data.adminNote ?? ''
    quotedPrice.value = res.data.quotedPrice ?? ''
  } finally { loading.value = false }
}

async function doUpdateStatus() {
  if (!newStatus.value) return ElMessage.warning('请选择状态')
  statusLoading.value = true
  try {
    await api.updateStatus(order.value.id, newStatus.value, remark.value || undefined)
    ElMessage.success('状态已更新')
    await loadOrder()
    remark.value = ''
    newStatus.value = ''
  } catch (e: any) {
    ElMessage.error(e.message ?? '操作失败')
  } finally { statusLoading.value = false }
}

async function doAddNote() {
  if (!adminNote.value.trim()) return ElMessage.warning('备注不能为空')
  noteLoading.value = true
  try {
    await api.addNote(order.value.id, adminNote.value)
    ElMessage.success('备注已保存')
    await loadOrder()
  } catch { ElMessage.error('保存失败') }
  finally { noteLoading.value = false }
}

async function doSetQuote() {
  if (!quotedPrice.value.trim()) return ElMessage.warning('报价不能为空')
  quoteLoading.value = true
  try {
    await api.setQuote(order.value.id, quotedPrice.value)
    ElMessage.success('报价已设置')
    await loadOrder()
  } catch { ElMessage.error('设置失败') }
  finally { quoteLoading.value = false }
}

onMounted(loadOrder)
</script>
