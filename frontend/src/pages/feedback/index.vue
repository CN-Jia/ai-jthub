<template>
  <div class="page-container">
    <h1 class="page-title">意见反馈</h1>
    <p class="page-sub">您的反馈对我们很重要，管理员会尽快回复</p>

    <div class="fb-layout">
      <!-- 左：提交表单 -->
      <div class="fb-form-wrap card">
        <h3 class="section-title">提交新反馈</h3>
        <form @submit.prevent="submitFeedback" class="fb-form">
          <div class="form-group">
            <label class="form-label">反馈类型</label>
            <select v-model="form.type" class="form-input">
              <option value="">请选择</option>
              <option value="BUG">Bug 反馈</option>
              <option value="SUGGESTION">功能建议</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">标题</label>
            <input v-model="form.title" class="form-input" placeholder="简要描述问题" />
          </div>
          <div class="form-group">
            <label class="form-label">详细描述</label>
            <textarea v-model="form.description" class="form-input" :rows="5" placeholder="请详细描述..." style="resize:vertical" />
          </div>
          <div v-if="formError" class="form-error">{{ formError }}</div>
          <button type="submit" class="btn btn-primary" style="width:100%" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交反馈' }}
          </button>
        </form>
      </div>

      <!-- 右：我的反馈列表 -->
      <div class="fb-list-wrap">
        <h3 class="section-title">我的反馈</h3>
        <div v-if="listLoading" class="loading-box"><span class="spinner" /></div>
        <div v-else-if="feedbacks.length === 0" class="empty-state" style="padding:32px 0">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-text">暂无反馈记录</div>
        </div>
        <div v-else class="fb-list">
          <div v-for="fb in feedbacks" :key="fb.id" class="fb-item card" @click="openDetail(fb)">
            <div class="fb-item-header">
              <span class="badge" :class="typeClass(fb.type)">{{ typeLabel(fb.type) }}</span>
              <span class="badge" :class="statusClass(fb.status)">{{ statusLabel(fb.status) }}</span>
              <span class="fb-time">{{ fmt(fb.createdAt) }}</span>
            </div>
            <p class="fb-item-title">{{ fb.title }}</p>
            <p v-if="fb.adminReply" class="fb-reply">💬 管理员回复：{{ fb.adminReply }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Transition name="modal">
      <div v-if="detailVisible" class="modal-overlay" @click.self="detailVisible = false">
        <div class="modal-box">
          <button class="modal-close" @click="detailVisible = false">✕</button>
          <div v-if="detail" class="modal-content">
            <div class="fb-item-header" style="margin-bottom:10px">
              <span class="badge" :class="typeClass(detail.type)">{{ typeLabel(detail.type) }}</span>
              <span class="badge" :class="statusClass(detail.status)">{{ statusLabel(detail.status) }}</span>
            </div>
            <h3 style="margin-bottom:8px">{{ detail.title }}</h3>
            <p style="color:var(--text-2);line-height:1.7;white-space:pre-wrap">{{ detail.description }}</p>
            <template v-if="detail.adminReply">
              <hr class="divider" />
              <div class="admin-reply">
                <p style="font-size:12px;color:var(--text-3);margin-bottom:6px">管理员回复 · {{ fmt(detail.repliedAt) }}</p>
                <p style="color:var(--primary);line-height:1.7">{{ detail.adminReply }}</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../../api'

const feedbacks = ref<any[]>([])
const listLoading = ref(false)
const submitting = ref(false)
const formError = ref('')
const form = ref({ type: '', title: '', description: '' })
const detailVisible = ref(false)
const detail = ref<any>(null)

const typeLabel = (t: string) => ({ BUG: 'Bug反馈', SUGGESTION: '建议', OTHER: '其他' }[t] ?? t)
const typeClass = (t: string) => ({ BUG: 'badge-red', SUGGESTION: 'badge-blue', OTHER: 'badge-gray' }[t] ?? 'badge-gray')
const statusLabel = (s: string) => ({ PENDING: '待处理', REPLIED: '已回复', RESOLVED: '已解决' }[s] ?? s)
const statusClass = (s: string) => ({ PENDING: 'badge-orange', REPLIED: 'badge-blue', RESOLVED: 'badge-green' }[s] ?? 'badge-gray')
const fmt = (d: string) => {
  if (!d) return '-'
  const date = new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

async function loadFeedbacks() {
  listLoading.value = true
  try {
    const res: any = await api.getMyFeedbacks()
    feedbacks.value = res.data.list
  } finally { listLoading.value = false }
}

async function submitFeedback() {
  formError.value = ''
  if (!form.value.type || !form.value.title || !form.value.description) {
    formError.value = '请填写所有字段'
    return
  }
  submitting.value = true
  try {
    await api.submitFeedback(form.value)
    form.value = { type: '', title: '', description: '' }
    loadFeedbacks()
  } catch (err: any) {
    formError.value = err?.message ?? '提交失败'
  } finally { submitting.value = false }
}

function openDetail(fb: any) { detail.value = fb; detailVisible.value = true }

onMounted(loadFeedbacks)
</script>

<style scoped>
.page-title { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
.page-sub { color: var(--text-3); font-size: 14px; margin-bottom: 24px; }
.fb-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: flex-start; }
.section-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; color: var(--text-1); }
.fb-form { display: flex; flex-direction: column; gap: 14px; }
.fb-list { display: flex; flex-direction: column; gap: 10px; }
.fb-item { cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s; }
.fb-item:hover { box-shadow: var(--shadow); border-color: #c0d8ff; }
.fb-item-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.fb-time { font-size: 11px; color: var(--text-3); margin-left: auto; }
.fb-item-title { font-size: 14px; font-weight: 600; color: var(--text-1); margin: 0; }
.fb-reply { font-size: 12px; color: var(--primary); margin-top: 6px; background: var(--primary-light); border-radius: 6px; padding: 6px 8px; }
.loading-box { display: flex; justify-content: center; padding: 32px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
.modal-box { background: var(--white); border-radius: 16px; padding: 28px; width: 100%; max-width: 500px; position: relative; box-shadow: var(--shadow-lg); }
.modal-close { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 16px; color: var(--text-3); cursor: pointer; }
.admin-reply { background: var(--primary-light); border-radius: 10px; padding: 12px 14px; border-left: 3px solid var(--primary); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .fb-layout { grid-template-columns: 1fr; }
}
</style>
