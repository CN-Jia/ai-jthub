<template>
  <view :class="['badge', `badge--${status.toLowerCase()}`]">{{ label }}</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const LABELS: Record<string, string> = {
  PENDING: '待确认',
  ACCEPTED: '已接单',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CLOSED: '已关闭',
}

const label = computed(() => LABELS[props.status] || props.status)
</script>

<style scoped>
.badge { display: inline-block; padding: 6rpx 20rpx; border-radius: 40rpx; font-size: 24rpx; font-weight: bold; }
.badge--pending    { background: #fff7e6; color: #fa8c16; }
.badge--accepted   { background: #e6f4ff; color: #1677ff; }
.badge--in_progress { background: #f0f5ff; color: #2f54eb; }
.badge--completed  { background: #f6ffed; color: #52c41a; }
.badge--closed     { background: #f5f5f5; color: #999;    }
</style>
