<template>
  <view class="guide">
    <text class="tip">请扫码完成确认付款</text>
    <text class="sub">付款时请在备注中填写项目编号</text>
    <view class="qr-row">
      <view class="qr-card" v-for="qr in qrCodes" :key="qr.label">
        <image :src="qr.url" class="qr-img" mode="aspectFit" />
        <text class="qr-label">{{ qr.label }}</text>
      </view>
    </view>
    <view class="order-tip">
      <text>项目编号：</text><text class="highlight">{{ orderNo }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '../utils/request'

const props = defineProps<{ orderNo: string }>()
const qrCodes = ref<Array<{ label: string; url: string }>>([])

onMounted(async () => {
  try {
    const res: any = await request({ url: '/api/config/payment-qr', method: 'GET' })
    qrCodes.value = [
      { label: '微信扫码', url: res.wechat },
      { label: '支付宝扫码', url: res.alipay },
    ]
  } catch { }
})
</script>

<style scoped>
.guide { background:#fff; border-radius:16rpx; padding:30rpx; margin:20rpx 0; }
.tip { font-size:32rpx; font-weight:bold; color:#333; display:block; margin-bottom:8rpx; }
.sub { font-size:26rpx; color:#999; display:block; margin-bottom:24rpx; }
.qr-row { display:flex; gap:20rpx; justify-content:center; }
.qr-card { text-align:center; }
.qr-img { width:240rpx; height:240rpx; }
.qr-label { font-size:26rpx; color:#666; display:block; margin-top:8rpx; }
.order-tip { margin-top:20rpx; font-size:28rpx; color:#333; }
.highlight { color:#1677ff; font-weight:bold; }
</style>
