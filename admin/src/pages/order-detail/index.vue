<template>
  <div v-if="order" class="sf-page">
    <div class="detail-grid">
      <!-- 左：订单信息 + 历史 -->
      <div class="col-left">
        <!-- 订单头 -->
        <div class="sf-panel" style="margin-bottom:14px">
          <div class="sf-panel-hd">
            <div class="sf-panel-hd-left">
              <span class="order-no">{{ order.orderNo }}</span>
              <el-tag :type="statusTag(order.status)">{{ statusLabel(order.status) }}</el-tag>
            </div>
          </div>
          <div class="sf-panel-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-key">课程名称</span>
                <span class="info-val">{{ order.courseName }}</span>
              </div>
              <div class="info-item">
                <span class="info-key">需求类型</span>
                <span class="info-val">{{ order.orderType?.name ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-key">参考价格</span>
                <span class="info-val">{{ order.orderType?.price ?? '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-key">年级</span>
                <span class="info-val">{{ gradeLabel(order.grade) }}</span>
              </div>
              <div class="info-item">
                <span class="info-key">截止日期</span>
                <span class="info-val">{{ fmtDate(order.deadline) }}</span>
              </div>
              <div class="info-item">
                <span class="info-key">联系微信</span>
                <span class="info-val accent">{{ order.contactWechat }}</span>
              </div>
              <div class="info-item">
                <span class="info-key">创建时间</span>
                <span class="info-val">{{ fmtDateTime(order.createdAt) }}</span>
              </div>
              <div v-if="order.quotedPrice" class="info-item">
                <span class="info-key">管理员报价</span>
                <span class="info-val accent">{{ order.quotedPrice }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 状态历史 -->
        <div class="sf-panel">
          <div class="sf-panel-hd">状态变更历史</div>
          <div class="sf-panel-body">
            <el-timeline>
              <el-timeline-item
                v-for="h in order.statusHistory"
                :key="h.id"
                :timestamp="fmtDateTime(h.createdAt)"
                placement="top"
              >
                <div class="history-item">
                  <el-tag :type="statusTag(h.toStatus)" size="small">{{ statusLabel(h.toStatus) }}</el-tag>
                  <span v-if="h.remark" class="history-remark">{{ h.remark }}</span>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>

      <!-- 右：操作面板 -->
      <div class="col-right">
        <!-- 更新状态 -->
        <div class="sf-panel action-panel">
          <div class="sf-panel-hd">更新状态</div>
          <div class="sf-panel-body">
            <el-select v-model="newStatus" placeholder="选择新状态" style="width:100%;margin-bottom:10px">
              <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
            <el-input v-model="remark" placeholder="备注（可选）" style="margin-bottom:10px" />
            <el-button type="primary" style="width:100%" @click="doUpdateStatus" :loading="statusLoading">
              确认更新
            </el-button>
          </div>
        </div>

        <!-- 设置报价 -->
        <div class="sf-panel action-panel">
          <div class="sf-panel-hd">设置报价</div>
          <div class="sf-panel-body">
            <el-input v-model="quotedPrice" placeholder="如：500元" style="margin-bottom:10px" />
            <el-button type="primary" style="width:100%" @click="doSetQuote" :loading="quoteLoading">
              确认报价
            </el-button>
          </div>
        </div>

        <!-- 内部备注 -->
        <div class="sf-panel action-panel">
          <div class="sf-panel-hd">内部备注</div>
          <div class="sf-panel-body">
            <el-input v-model="adminNote" type="textarea" :rows="4" placeholder="添加内部备注（用户不可见）" style="margin-bottom:10px" />
            <el-button style="width:100%" @click="doAddNote" :loading="noteLoading">保存备注</el-button>
            <div v-if="order.adminNote" class="current-note">
              <span class="note-label">当前备注</span>
              {{ order.adminNote }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="loading-wrap">
    <el-icon class="loading-icon"><Loading /></el-icon>
    <span>加载中...</span>
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
  { value: 'ACCEPTED',    label: '已接单' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED',   label: '已完成' },
  { value: 'CLOSED',      label: '已关闭' },
]
const statusLabel = (s: string) => (
  { PENDING: '待确认', ACCEPTED: '已接单', IN_PROGRESS: '进行中', COMPLETED: '已完成', CLOSED: '已关闭' } as any
)[s] ?? s
const statusTag = (s: string) => (
  { PENDING: 'warning', ACCEPTED: 'primary', IN_PROGRESS: '', COMPLETED: 'success', CLOSED: 'info' } as any
)[s] ?? ''
const gradeLabel = (g: string) => ({ FRESHMAN: '大一', SOPHOMORE: '大二', JUNIOR: '大三' } as any)[g] ?? g
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('zh-CN') : '—'
const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : '—'

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

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 14px;
  align-items: start;
}
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

.col-left, .col-right { display: flex; flex-direction: column; gap: 14px; }

.order-no { font-weight: 700; font-size: 15px; color: #e8f0fe; font-family: monospace; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
}
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-key  { font-size: 11px; color: #4d6a82; letter-spacing: 0.06em; text-transform: uppercase; }
.info-val  { font-size: 13.5px; color: #e8f0fe; }
.info-val.accent { color: #00d4ff; font-weight: 600; }

.history-item { display: flex; align-items: center; gap: 8px; }
.history-remark { font-size: 12px; color: #4d6a82; }

.action-panel { margin-bottom: 0; }

.current-note {
  margin-top: 12px;
  background: rgba(0,212,255,0.06);
  border: 1px solid rgba(0,212,255,0.12);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  color: #7fa5c0;
  line-height: 1.6;
}
.note-label {
  display: block;
  font-size: 10px;
  color: #4d6a82;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.loading-wrap {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; height: 200px;
  color: #4d6a82; font-size: 14px;
}
.loading-icon { font-size: 20px; color: #00d4ff; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
