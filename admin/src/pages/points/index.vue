<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>积分管理</h2>
    </div>

    <!-- 积分规则 -->
    <el-card class="section-card">
      <template #header>
        <span>积分规则配置</span>
      </template>
      <el-table :data="rules" v-loading="rulesLoading">
        <el-table-column prop="eventType" label="事件类型" width="200">
          <template #default="{ row }">{{ eventLabel(row.eventType) }}</template>
        </el-table-column>
        <el-table-column prop="points" label="奖励积分" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.points" :min="1" :max="9999" size="small" style="width:100px" />
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="启用" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="saveRule(row)">保存</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 用户积分汇总 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header-row">
          <span>用户积分汇总</span>
          <el-input v-model="keyword" placeholder="搜索昵称/用户名" clearable style="width:200px" @change="loadUsers" />
        </div>
      </template>
      <el-table :data="users" v-loading="usersLoading">
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="totalPoints" label="可用积分" />
        <el-table-column prop="frozenPoints" label="冻结积分" />
        <el-table-column prop="lifetimeEarned" label="累计获得" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="openAdjust(row)">调整</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="usersTotal > pageSize"
        class="pagination"
        :total="usersTotal"
        :page-size="pageSize"
        v-model:current-page="currentPage"
        @current-change="loadUsers"
        layout="prev, pager, next"
      />
    </el-card>

    <!-- 手动调整积分弹窗 -->
    <el-dialog v-model="adjustDialog" title="手动调整积分" width="360px">
      <div class="adjust-form">
        <p>用户：<strong>{{ adjustTarget?.nickname }}</strong>（{{ adjustTarget?.username }}）</p>
        <p>当前积分：{{ adjustTarget?.totalPoints }}</p>
        <el-form label-position="top">
          <el-form-item label="调整量（正数加，负数减）">
            <el-input-number v-model="adjustDelta" :min="-99999" :max="99999" style="width:100%" />
          </el-form-item>
          <el-form-item label="备注（可选）">
            <el-input v-model="adjustRemark" placeholder="如：活动奖励" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="adjustDialog = false">取消</el-button>
        <el-button type="primary" :loading="adjusting" @click="submitAdjust">确认调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../../api'

const EVENT_LABELS: Record<string, string> = {
  INVITE_REGISTER: '邀请注册奖励',
  INVITE_FIRST_ORDER: '拉新首购奖励（给邀请者）',
  NEW_USER_FIRST_ORDER: '新用户首购奖励',
  ADMIN_ADJUST: '管理员手动调整',
}
function eventLabel(t: string) { return EVENT_LABELS[t] ?? t }

const rules = ref<any[]>([])
const rulesLoading = ref(false)
const users = ref<any[]>([])
const usersLoading = ref(false)
const usersTotal = ref(0)
const currentPage = ref(1)
const pageSize = 20
const keyword = ref('')

const adjustDialog = ref(false)
const adjustTarget = ref<any>(null)
const adjustDelta = ref(0)
const adjustRemark = ref('')
const adjusting = ref(false)

async function loadRules() {
  rulesLoading.value = true
  try {
    const res: any = await api.getPointRules()
    rules.value = res.data.rules
    // 补全缺失的规则
    const existing = new Set(rules.value.map((r: any) => r.eventType))
    const defaults = [
      { eventType: 'INVITE_REGISTER', points: 50, enabled: true },
      { eventType: 'INVITE_FIRST_ORDER', points: 100, enabled: true },
      { eventType: 'NEW_USER_FIRST_ORDER', points: 30, enabled: true },
    ]
    defaults.forEach(d => { if (!existing.has(d.eventType)) rules.value.push(d) })
  } finally {
    rulesLoading.value = false
  }
}

async function saveRule(row: any) {
  try {
    await api.updatePointRule(row.eventType, { points: row.points, enabled: row.enabled })
    ElMessage.success('规则已保存')
  } catch {
    ElMessage.error('保存失败')
  }
}

async function loadUsers() {
  usersLoading.value = true
  try {
    const res: any = await api.getPointUsers({ page: currentPage.value, pageSize, keyword: keyword.value || undefined })
    users.value = res.data.list
    usersTotal.value = res.data.total
  } finally {
    usersLoading.value = false
  }
}

function openAdjust(row: any) {
  adjustTarget.value = row
  adjustDelta.value = 0
  adjustRemark.value = ''
  adjustDialog.value = true
}

async function submitAdjust() {
  if (!adjustTarget.value || adjustDelta.value === 0) return
  adjusting.value = true
  try {
    await api.adjustPoints(adjustTarget.value.userId, adjustDelta.value, adjustRemark.value || undefined)
    ElMessage.success('积分调整成功')
    adjustDialog.value = false
    loadUsers()
  } catch (err: any) {
    ElMessage.error(err?.message ?? '调整失败')
  } finally {
    adjusting.value = false
  }
}

onMounted(() => {
  loadRules()
  loadUsers()
})
</script>

<style scoped>
.admin-page { padding: 24px; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 1.4rem; font-weight: 700; }
.section-card { margin-bottom: 24px; }
.card-header-row { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.adjust-form { display: flex; flex-direction: column; gap: 8px; }
</style>
