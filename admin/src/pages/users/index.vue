<template>
  <div class="page-box">
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索昵称/用户名/邮箱" style="width:260px" clearable @keyup.enter="load">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button @click="load">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" class="dark-table">
      <el-table-column label="用户名" prop="username" width="130" />
      <el-table-column label="昵称" prop="nickname" width="120" />
      <el-table-column label="邮箱" prop="email" min-width="180" show-overflow-tooltip />
      <el-table-column label="手机" prop="phone" width="130" />
      <el-table-column label="年级" width="90">
        <template #default="{ row }">{{ gradeLabel(row.grade) }}</template>
      </el-table-column>
      <el-table-column label="订单数" width="80">
        <template #default="{ row }">{{ row._count?.orders ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="邮箱验证" width="90">
        <template #default="{ row }">
          <el-tag :type="row.emailVerified ? 'success' : 'warning'" size="small">{{ row.emailVerified ? '已验证' : '未验证' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">{{ row.isActive ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="150">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button :type="row.isActive ? 'danger' : 'success'" size="small" plain
            @click="toggle(row)">{{ row.isActive ? '禁用' : '启用' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-if="total > pageSize" class="pagination" background layout="prev, pager, next"
      :total="total" :page-size="pageSize" :current-page="page" @current-change="p => { page = p; load() }" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../../api'
import { format } from 'date-fns'

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20
const keyword = ref('')

const gradeLabel = (g: string) => ({ FRESHMAN: '大一', SOPHOMORE: '大二', JUNIOR: '大三' }[g] ?? '-')
const fmt = (d: string) => format(new Date(d), 'MM-dd HH:mm')

async function load() {
  loading.value = true
  try {
    const res: any = await api.getUsers({ page: page.value, pageSize, keyword: keyword.value || undefined })
    list.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

async function toggle(row: any) {
  await api.toggleUser(row.id, !row.isActive)
  ElMessage.success(`已${row.isActive ? '禁用' : '启用'}该用户`)
  load()
}

onMounted(load)
</script>

<style scoped>
.page-box { display: flex; flex-direction: column; gap: 16px; }
.toolbar { display: flex; gap: 8px; align-items: center; }
.pagination { margin-top: 8px; justify-content: flex-end; }
</style>
