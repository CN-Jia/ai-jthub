<template>
  <div class="admin-page">
    <div class="page-header">
      <h2>积分商城商品</h2>
      <el-button type="primary" @click="openCreate">新建商品</el-button>
    </div>

    <el-table :data="items" v-loading="loading">
      <el-table-column prop="name" label="商品名称" min-width="160" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'COUPON' ? 'warning' : 'primary'" size="small">
            {{ row.type === 'COUPON' ? '折扣券' : '服务套餐' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="pointsCost" label="所需积分" width="110" />
      <el-table-column prop="discountAmt" label="折扣面值" width="100">
        <template #default="{ row }">{{ row.discountAmt ? `¥${row.discountAmt}` : '—' }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="90">
        <template #default="{ row }">{{ row.stock === -1 ? '无限' : row.stock }}</template>
      </el-table-column>
      <el-table-column prop="isActive" label="上架" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.isActive" @change="toggleActive(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialog" :title="editing ? '编辑商品' : '新建商品'" width="500px">
      <el-form :model="form" label-position="top">
        <el-form-item label="商品名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="商品类型" required>
          <el-radio-group v-model="form.type">
            <el-radio value="SERVICE">服务套餐</el-radio>
            <el-radio value="COUPON">折扣券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="所需积分" required>
          <el-input-number v-model="form.pointsCost" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="form.type === 'COUPON'" label="折扣金额（元）" required>
          <el-input-number v-model="form.discountAmt" :min="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="库存（-1 = 无限）">
          <el-input-number v-model="form.stock" :min="-1" style="width:100%" />
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="封面图 URL">
          <el-input v-model="form.coverUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="排序（数字越小越靠前）">
          <el-input-number v-model="form.sortOrder" style="width:100%" />
        </el-form-item>
        <el-form-item label="是否上架">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '../../api'

const items = ref<any[]>([])
const loading = ref(false)
const dialog = ref(false)
const editing = ref<any>(null)
const saving = ref(false)

const defaultForm = () => ({
  name: '', type: 'SERVICE', pointsCost: 100, discountAmt: null as number | null,
  stock: -1, description: '', coverUrl: '', sortOrder: 0, isActive: true,
})
const form = ref(defaultForm())

async function loadItems() {
  loading.value = true
  try {
    const res: any = await api.getAdminShopItems()
    items.value = res.data.list
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = defaultForm()
  dialog.value = true
}

function openEdit(row: any) {
  editing.value = row
  form.value = { ...row }
  dialog.value = true
}

async function handleSave() {
  if (!form.value.name) return ElMessage.warning('请填写商品名称')
  saving.value = true
  try {
    const data = { ...form.value }
    if (data.type !== 'COUPON') data.discountAmt = null
    if (editing.value) {
      await api.updateShopItem(editing.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await api.createShopItem(data)
      ElMessage.success('创建成功')
    }
    dialog.value = false
    loadItems()
  } catch (err: any) {
    ElMessage.error(err?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleActive(row: any) {
  try {
    await api.updateShopItem(row.id, { isActive: row.isActive })
    ElMessage.success(row.isActive ? '已上架' : '已下架')
  } catch {
    row.isActive = !row.isActive
    ElMessage.error('操作失败')
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除商品「${row.name}」？`, '确认删除', { type: 'warning' })
  try {
    await api.deleteShopItem(row.id)
    ElMessage.success('删除成功')
    loadItems()
  } catch (err: any) {
    ElMessage.error(err?.message ?? '删除失败')
  }
}

onMounted(loadItems)
</script>

<style scoped>
.admin-page { padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 1.4rem; font-weight: 700; }
</style>
