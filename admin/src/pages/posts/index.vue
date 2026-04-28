<template>
  <div class="page-box">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width:110px" @change="load">
          <el-option label="待审核" value="PENDING" />
          <el-option label="已发布" value="APPROVED" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
        <el-select v-model="filterType" placeholder="类型" clearable style="width:110px;margin-left:8px" @change="load">
          <el-option label="公告" value="ANNOUNCEMENT" />
          <el-option label="讨论" value="DISCUSSION" />
        </el-select>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon> 发布公告
      </el-button>
    </div>

    <el-table :data="posts" v-loading="loading" class="dark-table" row-class-name="dark-row">
      <el-table-column label="标题" prop="title" min-width="220" show-overflow-tooltip />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="row.type === 'ANNOUNCEMENT' ? 'primary' : ''" size="small">
            {{ row.type === 'ANNOUNCEMENT' ? '公告' : '讨论' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="作者" width="110">
        <template #default="{ row }">{{ row.author?.nickname ?? '管理员' }}</template>
      </el-table-column>
      <el-table-column label="评论" width="70" prop="_count.comments" />
      <el-table-column label="发布时间" width="160">
        <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'PENDING'">
            <el-button type="success" size="small" @click="review(row.id, 'APPROVED')">通过</el-button>
            <el-button type="danger" size="small" @click="review(row.id, 'REJECTED')">拒绝</el-button>
          </template>
          <el-button v-if="row.type === 'ANNOUNCEMENT'" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" size="small" plain @click="del(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-if="total > pageSize" class="pagination" background layout="prev, pager, next"
      :total="total" :page-size="pageSize" :current-page="page" @current-change="p => { page = p; load() }" />

    <!-- 发布/编辑公告 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑公告' : '发布公告'" width="700px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="公告标题" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" placeholder="一句话简介（可选）" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="支持 Markdown" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'
import { format } from 'date-fns'

const posts = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20
const filterStatus = ref('')
const filterType = ref('')

const dialogVisible = ref(false)
const submitting = ref(false)
const editId = ref('')
const form = ref({ title: '', summary: '', content: '' })

const statusLabel = (s: string) => ({ PENDING: '待审核', APPROVED: '已发布', REJECTED: '已拒绝' }[s] ?? s)
const statusType = (s: string) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }[s] ?? '')
const fmt = (d: string) => format(new Date(d), 'MM-dd HH:mm')

async function load() {
  loading.value = true
  try {
    const res: any = await api.getPosts({ page: page.value, pageSize, status: filterStatus.value || undefined, type: filterType.value || undefined })
    posts.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

function openCreate() { editId.value = ''; form.value = { title: '', summary: '', content: '' }; dialogVisible.value = true }
function openEdit(row: any) { editId.value = row.id; form.value = { title: row.title, summary: row.summary ?? '', content: row.content }; dialogVisible.value = true }

async function submit() {
  if (!form.value.title || !form.value.content) return ElMessage.warning('请填写标题和内容')
  submitting.value = true
  try {
    if (editId.value) await api.updatePost(editId.value, form.value)
    else await api.createPost(form.value)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    load()
  } catch { ElMessage.error('操作失败') } finally { submitting.value = false }
}

async function review(id: string, status: 'APPROVED' | 'REJECTED') {
  await api.reviewPost(id, status)
  ElMessage.success(status === 'APPROVED' ? '已通过' : '已拒绝')
  load()
}

async function del(id: string) {
  await ElMessageBox.confirm('确认删除此帖子？', '警告', { type: 'warning' })
  await api.deletePost(id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.page-box { display: flex; flex-direction: column; gap: 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 8px; justify-content: flex-end; }
</style>
