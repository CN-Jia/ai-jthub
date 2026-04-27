<template>
  <view class="container">
    <view class="card">
      <view class="title">订单进度查询</view>
      <view class="form-item">
        <text class="label">订单号</text>
        <input v-model="orderNo" placeholder="如：JT-20260419-ABCD" class="input" />
      </view>
      <view class="form-item">
        <text class="label">联系邮箱</text>
        <input v-model="email" placeholder="提交需求时填写的邮箱" class="input" type="text" />
      </view>
      <button class="query-btn" @click="handleQuery" :disabled="loading">
        {{ loading ? '查询中...' : '查询进度' }}
      </button>
    </view>

    <view v-if="order" class="result-card">
      <view class="result-title">订单详情</view>
      <view class="info-row"><text class="info-label">订单号</text><text class="info-value">{{ order.orderNo }}</text></view>
      <view class="info-row"><text class="info-label">项目标题</text><text class="info-value">{{ order.title }}</text></view>
      <view class="info-row"><text class="info-label">需求类型</text><text class="info-value">{{ order.projectType }}</text></view>
      <view class="info-row"><text class="info-label">截止日期</text><text class="info-value">{{ formatDate(order.deadline) }}</text></view>
      <view class="info-row">
        <text class="info-label">当前状态</text>
        <StatusBadge :status="order.status" />
      </view>
      <view v-if="order.quotedPrice" class="info-row"><text class="info-label">报价</text><text class="info-value">¥{{ order.quotedPrice }}</text></view>
      <view v-if="order.downloadUrl" class="download-section">
        <text class="download-title">项目已完成，下载链接：</text>
        <button class="copy-btn" @click="copyLink(order.downloadUrl)">复制下载链接</button>
        <text v-if="order.downloadExpiresAt" class="expire-tip">链接有效期至 {{ formatDate(order.downloadExpiresAt) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { request } from '../../utils/request'
import StatusBadge from '../../components/StatusBadge.vue'

const orderNo = ref('')
const email = ref('')
const loading = ref(false)
const order = ref<any>(null)

async function handleQuery() {
  if (!orderNo.value || !email.value) {
    uni.showToast({ title: '请填写订单号和邮箱', icon: 'none' })
    return
  }
  loading.value = true
  order.value = null
  try {
    const res = await request<any>({
      url: '/api/orders/query',
      method: 'POST',
      data: { orderNo: orderNo.value, email: email.value },
    })
    order.value = res
  } catch (e: any) {
    uni.showToast({ title: e?.message || '订单不存在或信息不匹配', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function copyLink(url: string) {
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '链接已复制', icon: 'success' }),
  })
}
</script>

<style scoped>
.container { padding: 20rpx; background: #f5f7fa; min-height: 100vh; }
.card { background: #fff; border-radius: 16rpx; padding: 40rpx; margin-bottom: 24rpx; }
.title { font-size: 36rpx; font-weight: bold; color: #1a1a1a; margin-bottom: 40rpx; text-align: center; }
.form-item { margin-bottom: 28rpx; }
.label { font-size: 28rpx; color: #555; display: block; margin-bottom: 10rpx; }
.input { border: 2rpx solid #e0e0e0; border-radius: 8rpx; padding: 20rpx; font-size: 28rpx; width: 100%; box-sizing: border-box; }
.query-btn { background: #1677ff; color: #fff; border-radius: 8rpx; padding: 24rpx; font-size: 32rpx; }
.result-card { background: #fff; border-radius: 16rpx; padding: 40rpx; }
.result-title { font-size: 32rpx; font-weight: bold; margin-bottom: 28rpx; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.info-label { color: #888; font-size: 28rpx; }
.info-value { color: #333; font-size: 28rpx; }
.download-section { margin-top: 28rpx; padding: 24rpx; background: #f0f9ff; border-radius: 8rpx; }
.download-title { font-size: 28rpx; color: #1677ff; display: block; margin-bottom: 16rpx; }
.copy-btn { background: #1677ff; color: #fff; border-radius: 8rpx; padding: 16rpx; font-size: 28rpx; }
.expire-tip { font-size: 24rpx; color: #999; display: block; margin-top: 12rpx; }
</style>
