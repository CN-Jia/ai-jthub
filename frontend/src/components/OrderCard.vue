<template>
  <view class="order-card" @click="$emit('click')">
    <view class="card-header">
      <text class="card-title">{{ order.title }}</text>
      <StatusBadge :status="order.status" />
    </view>
    <view class="card-info">
      <text class="order-no">{{ order.orderNo }}</text>
      <text class="deadline">截止：{{ formatDate(order.deadline) }}</text>
    </view>
    <view class="card-type">{{ order.projectType }}</view>
  </view>
</template>

<script setup lang="ts">
import StatusBadge from './StatusBadge.vue'

defineProps<{ order: any }>()
defineEmits(['click'])

function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : '-'
}
</script>

<style scoped>
.order-card { background: #fff; border-radius: 16rpx; padding: 32rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: #1a1a1a; flex: 1; margin-right: 16rpx; }
.card-info { display: flex; justify-content: space-between; margin-bottom: 12rpx; }
.order-no { font-size: 24rpx; color: #999; }
.deadline { font-size: 24rpx; color: #f56c6c; }
.card-type { font-size: 24rpx; color: #666; background: #f5f7fa; display: inline-block; padding: 4rpx 16rpx; border-radius: 6rpx; }
</style>
