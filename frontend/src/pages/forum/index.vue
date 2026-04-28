<template>
  <div class="page-container">
    <div class="forum-header">
      <h1 class="forum-title">论坛 · 交流区</h1>
      <p class="forum-sub">浏览公告、参与讨论，共建学习社区</p>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-row">
      <button v-for="t in tabs" :key="t.value" class="tab-btn" :class="{ active: activeTab === t.value }" @click="switchTab(t.value)">
        {{ t.label }}
      </button>
      <router-link v-if="store.isLoggedIn" to="/forum/new" class="btn btn-primary new-post-btn">+ 发帖</router-link>
    </div>

    <div v-if="loading" class="loading-box">
      <span class="spinner" />
    </div>

    <div v-else-if="posts.length === 0" class="empty-state">
      <div class="empty-state-icon">💬</div>
      <div class="empty-state-text">暂无帖子</div>
    </div>

    <div v-else class="post-list">
      <router-link v-for="post in posts" :key="post.id" :to="`/forum/${post.id}`" class="post-card">
        <div class="post-meta">
          <span class="badge" :class="post.type === 'ANNOUNCEMENT' ? 'badge-blue' : 'badge-gray'">
            {{ post.type === 'ANNOUNCEMENT' ? '📢 公告' : '💬 讨论' }}
          </span>
          <span class="post-date">{{ fmt(post.createdAt) }}</span>
        </div>
        <h3 class="post-title">{{ post.title }}</h3>
        <p v-if="post.summary" class="post-summary">{{ post.summary }}</p>
        <div class="post-footer">
          <span class="post-author">{{ post.author?.nickname ?? '管理员' }}</span>
          <span class="post-comments">💬 {{ post._count?.comments ?? 0 }} 条评论</span>
        </div>
      </router-link>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <button class="page-btn" :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
      <span class="page-info">第 {{ page }} / {{ Math.ceil(total / pageSize) }} 页</span>
      <button class="page-btn" :disabled="page >= Math.ceil(total / pageSize)" @click="changePage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../store/user'
import { api } from '../../api'

const store = useUserStore()
const posts = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 10
const activeTab = ref('')

const tabs = [
  { label: '全部', value: '' },
  { label: '📢 公告', value: 'ANNOUNCEMENT' },
  { label: '💬 讨论', value: 'DISCUSSION' },
]

const fmt = (d: string) => {
  const date = new Date(d)
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

async function load() {
  loading.value = true
  try {
    const res: any = await api.getPosts({ page: page.value, pageSize, type: activeTab.value || undefined })
    posts.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

function switchTab(val: string) { activeTab.value = val; page.value = 1; load() }
function changePage(p: number) { page.value = p; load() }

onMounted(load)
</script>

<style scoped>
.forum-header { text-align: center; padding: 32px 0 24px; }
.forum-title { font-size: 28px; font-weight: 800; color: var(--text-1); margin-bottom: 8px; }
.forum-sub { color: var(--text-3); font-size: 15px; }

.filter-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 20px; flex-wrap: wrap;
}
.tab-btn {
  padding: 6px 16px; border-radius: 20px; border: 1.5px solid var(--border);
  background: var(--white); font-size: 13px; font-weight: 500; color: var(--text-2);
  cursor: pointer; transition: all 0.15s;
}
.tab-btn.active, .tab-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.new-post-btn { margin-left: auto; padding: 7px 16px; font-size: 13px; }

.loading-box { display: flex; justify-content: center; padding: 40px; }

.post-list { display: flex; flex-direction: column; gap: 12px; }
.post-card {
  display: block; background: var(--card-bg); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 18px 20px;
  transition: box-shadow 0.15s, border-color 0.15s; cursor: pointer;
  color: inherit;
}
.post-card:hover { box-shadow: var(--shadow); border-color: #c0d8ff; }
.post-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.post-date { font-size: 12px; color: var(--text-3); }
.post-title { font-size: 16px; font-weight: 700; color: var(--text-1); margin-bottom: 6px; line-height: 1.4; }
.post-summary { font-size: 13px; color: var(--text-2); margin-bottom: 10px; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.post-footer { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-3); }
.post-author::before { content: '👤 '; }
.post-comments { color: var(--text-3); }

.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 24px 0; }
.page-btn { padding: 8px 20px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--white); color: var(--text-2); font-size: 14px; cursor: pointer; }
.page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 14px; color: var(--text-3); }
</style>
