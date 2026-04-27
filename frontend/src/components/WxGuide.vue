<template>
  <view class="guide">
    <text class="tip">需求已提交，请添加技术支持完成确认</text>
    <text class="sub">添加后请备注您的项目编号，我们将在24小时内回复</text>
    <view class="wechat-row">
      <text class="wechat-id">{{ wechatId }}</text>
      <button class="copy-btn" @tap="copyWechatId">复制微信号</button>
    </view>
    <view class="order-tip">
      <text>您的项目编号：</text><text class="highlight">{{ orderNo }}</text>
    </view>
    <view class="steps">
      <text class="step">① 复制上方微信号</text>
      <text class="step">② 在微信中搜索并添加</text>
      <text class="step">③ 备注项目编号，等待确认</text>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{ orderNo: string; wechatId: string }>()

function copyWechatId() {
  uni.setClipboardData({
    data: props.wechatId,
    success: () => uni.showToast({ title: '微信号已复制', icon: 'success' }),
  })
}
</script>

<style scoped>
.guide { background:#fff; border-radius:16rpx; padding:30rpx; margin:20rpx 0; }
.tip { font-size:32rpx; font-weight:bold; color:#333; display:block; margin-bottom:8rpx; }
.sub { font-size:26rpx; color:#999; display:block; margin-bottom:24rpx; }
.wechat-row { display:flex; align-items:center; gap:16rpx; margin-bottom:16rpx; }
.wechat-id { font-size:34rpx; font-weight:bold; color:#1677ff; }
.copy-btn { background:#1677ff; color:#fff; font-size:26rpx; border-radius:8rpx; padding:10rpx 24rpx; flex-shrink:0; }
.order-tip { margin-bottom:20rpx; font-size:28rpx; color:#333; }
.highlight { color:#1677ff; font-weight:bold; }
.steps { background:#f5f7fa; border-radius:12rpx; padding:20rpx; }
.step { font-size:26rpx; color:#666; display:block; line-height:2; }
</style>
