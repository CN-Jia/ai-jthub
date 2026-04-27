<template>
  <view class="container">
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="!order" class="error">项目不存在</view>
    <view v-else>
      <view class="card">
        <view class="order-no">{{ order.orderNo }}</view>
        <view class="title">{{ order.title }}</view>
        <view class="badge-row"><StatusBadge :status="order.status" /></view>
      </view>

      <view class="card">
        <view class="section-title">项目信息</view>
        <view class="info-row"><text class="info-label">需求类型</text><text class="info-value">{{ order.projectType }}</text></view>
        <view class="info-row"><text class="info-label">截止日期</text><text class="info-value">{{ formatDate(order.deadline) }}</text></view>
        <view class="info-row"><text class="info-label">联系邮箱</text><text class="info-value">{{ order.contactEmail }}</text></view>
        <view v-if="order.quotedPrice" class="info-row"><text class="info-label">确认报价</text><text class="info-value primary">¥{{ order.quotedPrice }}</text></view>
        <view class="desc-label">需求描述</view>
        <view class="desc-text">{{ order.description }}</view>
      </view>

      <!-- 状态时间线 -->
      <view class="card">
        <view class="section-title">进度时间线</view>
        <view v-for="h in order.statusHistory" :key="h.id" class="timeline-item">
          <view class="timeline-dot"></view>
          <view class="timeline-content">
            <text class="timeline-status">{{ statusLabel(h.toStatus) }}</text>
            <text class="timeline-time">{{ formatDateTime(h.createdAt) }}</text>
            <text v-if="h.remark" class="timeline-remark">{{ h.remark }}</text>
          </view>
        </view>
      </view>

      <!-- 文件下载（完成状态） -->
      <view v-if="order.status === 'COMPLETED' && order.downloadUrl" class="card download-card">
        <view class="section-title">项目已完成</view>
        <text class="download-tip">成品文件已准备好，点击下方按钮复制下载链接，在浏览器中打开即可下载</text>
        <button class="copy-btn" @click="copyLink">复制下载链接</button>
        <text v-if="order.downloadExpiresAt" class="expire-tip">链接有效期至 {{ formatDate(order.downloadExpiresAt) }}（剩余 {{ daysLeft(order.downloadExpiresAt) }} 天）</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '../../utils/request'
import StatusBadge from '../../components/StatusBadge.vue'

const order = ref<any>(null)
const loading = ref(true)

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待确认', ACCEPTED: '已接单', IN_PROGRESS: '进行中', COMPLETED: '已完成', CLOSED: '已关闭',
}
function statusLabel(s: string) { return STATUS_LABELS[s] || s }

onLoad(async (options: any) => {
  const id = options?.id
  if (!id) { loading.value = false; return }
  try {
    order.value = await request<any>({ url: `/api/orders/${id}`, method: 'GET' })
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('zh-CN') : '-' }
function formatDateTime(d: string) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
function daysLeft(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}
function copyLink() {
  uni.setClipboardData({
    data: order.value?.downloadUrl,
    success: () => uni.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'success' }),
  })
}
</script>

<style scoped>
.container { padding: 20rpx; background: #f5f7fa; min-height: 100vh; }
.loading { text-align: center; color: #999; padding: 80rpx; }
.error { text-align: center; color: #f00; padding: 80rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 36rpx; margin-bottom: 20rpx; }
.order-no { font-size: 24rpx; color: #999; margin-bottom: 8rpx; }
.title { font-size: 34rpx; font-weight: bold; color: #1a1a1a; margin-bottom: 16rpx; }
.badge-row { margin-top: 8rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.info-row { display: flex; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.info-label { color: #888; font-size: 28rpx; }
.info-value { color: #333; font-size: 28rpx; }
.info-value.primary { color: #f56c6c; font-weight: bold; }
.desc-label { color: #888; font-size: 28rpx; margin-top: 20rpx; margin-bottom: 10rpx; }
.desc-text { font-size: 28rpx; color: #555; line-height: 1.6; }
.timeline-item { display: flex; padding: 16rpx 0; }
.timeline-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #1677ff; margin-top: 8rpx; margin-right: 20rpx; flex-shrink: 0; }
.timeline-content { flex: 1; }
.timeline-status { font-size: 28rpx; color: #333; font-weight: bold; display: block; }
.timeline-time { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
.timeline-remark { font-size: 24rpx; color: #666; display: block; margin-top: 4rpx; }
.download-card { background: #f0f9ff; }
.download-tip { font-size: 26rpx; color: #555; display: block; margin-bottom: 20rpx; line-height: 1.6; }
.copy-btn { background: #1677ff; color: #fff; border-radius: 8rpx; padding: 20rpx; font-size: 30rpx; }
.expire-tip { font-size: 24rpx; color: #f56c6c; display: block; margin-top: 16rpx; }
</style>
