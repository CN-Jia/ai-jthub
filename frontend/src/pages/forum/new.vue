<template>
  <div class="page-container">
    <button class="back-btn" @click="$router.back()">← 返回论坛</button>

    <div class="card" style="max-width:720px">
      <h2 class="form-title">发布讨论帖</h2>
      <p class="form-sub">帖子发布后需管理员审核通过才会公开显示</p>

      <form @submit.prevent="submit" class="form">
        <div class="form-group">
          <label class="form-label">标题 <span class="req">*</span></label>
          <input v-model="form.title" class="form-input" placeholder="帖子标题（2-100字）" />
        </div>
        <div class="form-group">
          <label class="form-label">摘要</label>
          <input v-model="form.summary" class="form-input" placeholder="一句话简介（可选，最多200字）" />
        </div>
        <div class="form-group">
          <label class="form-label">正文 <span class="req">*</span></label>
          <textarea v-model="form.content" class="form-input" :rows="10" placeholder="支持 **粗体** 和 `代码` 语法" style="resize:vertical" />
        </div>
        <div class="form-group">
          <label class="form-label">封面图链接</label>
          <input v-model="form.cover" class="form-input" placeholder="https://...（可选）" />
        </div>
        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
        <button type="submit" class="btn btn-primary" style="width:100%" :disabled="submitting">
          {{ submitting ? '发布中...' : '发布帖子' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { api } from '../../api'

const router = useRouter()
const store = useUserStore()
const submitting = ref(false)
const errorMsg = ref('')
const form = reactive({ title: '', summary: '', content: '', cover: '' })

async function submit() {
  errorMsg.value = ''
  if (!form.title.trim() || form.title.length < 2) { errorMsg.value = '标题至少2个字'; return }
  if (!form.content.trim() || form.content.length < 10) { errorMsg.value = '正文内容至少10个字'; return }

  submitting.value = true
  try {
    const payload: any = { title: form.title, content: form.content }
    if (form.summary.trim()) payload.summary = form.summary
    if (form.cover.trim()) payload.cover = form.cover
    await api.createPost(payload)
    alert('发布成功，等待管理员审核')
    router.push('/forum')
  } catch (err: any) {
    errorMsg.value = err?.message ?? '发布失败'
  } finally { submitting.value = false }
}
</script>

<style scoped>
.back-btn { background: none; border: none; color: var(--primary); font-size: 14px; cursor: pointer; padding: 0 0 16px; display: block; }
.back-btn:hover { text-decoration: underline; }
.form-title { font-size: 22px; font-weight: 800; color: var(--text-1); margin-bottom: 6px; }
.form-sub { font-size: 13px; color: var(--text-3); margin-bottom: 24px; }
.form { display: flex; flex-direction: column; gap: 16px; }
.req { color: var(--danger); }
.form-error { font-size: 13px; color: var(--danger); background: #fff1f0; padding: 8px 12px; border-radius: 6px; }
</style>
