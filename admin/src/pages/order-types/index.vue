<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>需求类型管理</span>
        <el-button type="primary" @click="openCreate">添加类型</el-button>
      </div>
    </template>

    <el-table :data="types" stripe v-loading="loading">
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column prop="name" label="类型名称" width="180" />
      <el-table-column prop="price" label="参考价格" width="160" />
      <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '已上架' : '已下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.isActive ? 'warning' : 'success'"
            @click="toggleActive(row)">{{ row.isActive ? '下架' : '上架' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑/创建弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '编辑类型' : '添加类型'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="类型名称" required>
          <el-input v-model="form.name" placeholder="如：期末作业" />
        </el-form-item>
        <el-form-item label="参考价格" required>
          <el-input v-model="form.price" placeholder="如：200-500元" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="类型说明（可选）" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sortOrder" :min="0" />
          <span style="margin-left:8px;color:#888;font-size:12px">数字越小越靠前</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const types = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editId = ref('')
const saving = ref(false)
const form = reactive({ name: '', price: '', description: '', sortOrder: 0, isActive: true })

async function loadTypes() {
  loading.value = true
  try {
    const res: any = await api.getOrderTypes()
    types.value = res.data
  } finally { loading.value = false }
}

function openCreate() {
  editId.value = ''
  Object.assign(form, { name: '', price: '', description: '', sortOrder: 0, isActive: true })
  dialogVisible.value = true
}

function openEdit(row: any) {
  editId.value = row.id
  Object.assign(form, { name: row.name, price: row.price, description: row.description ?? '', sortOrder: row.sortOrder, isActive: row.isActive })
  dialogVisible.value = true
}

async function doSave() {
  if (!form.name.trim() || !form.price.trim()) return ElMessage.warning('名称和价格不能为空')
  saving.value = true
  try {
    if (editId.value) {
      await api.updateOrderType(editId.value, form)
      ElMessage.success('已更新')
    } else {
      await api.createOrderType(form)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadTypes()
  } catch (e: any) {
    ElMessage.error(e.message ?? '操作失败')
  } finally { saving.value = false }
}

async function toggleActive(row: any) {
  try {
    await api.updateOrderType(row.id, { isActive: !row.isActive })
    ElMessage.success(row.isActive ? '已下架' : '已上架')
    await loadTypes()
  } catch { ElMessage.error('操作失败') }
}

onMounted(loadTypes)
</script>
