<template>
  <view class="container">
    <view class="header">我的项目</view>
    <view v-if="loading && !orders.length" class="loading">加载中...</view>
    <view v-else-if="!orders.length" class="empty">
      <text>暂无项目记录</text>
      <button class="submit-btn" @click="goSubmit">提交新需求</button>
    </view>
    <view v-else>
      <OrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        @click="goDetail(order.id)"
      />
      <view v-if="hasMore" class="load-more" @click="loadMore">加载更多</view>
      <view v-else class="no-more">— 已加载全部 —</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '../../utils/request'
import OrderCard from '../../components/OrderCard.vue'

const orders = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

onMounted(() => fetchOrders())

async function fetchOrders(reset = false) {
  if (loading.value) return
  if (reset) { orders.value = []; page.value = 1; hasMore.value = true }
  loading.value = true
  try {
    const res = await request<{ list: any[]; total: number }>({
      url: `/api/orders/my?page=${page.value}&pageSize=10`,
      method: 'GET',
    })
    orders.value = reset ? res.list : [...orders.value, ...res.list]
    hasMore.value = orders.value.length < res.total
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchOrders()
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/project-detail/index?id=${id}` })
}

function goSubmit() {
  uni.navigateTo({ url: '/pages/submit/index' })
}
</script>

<style scoped>
.container { padding: 20rpx; background: #f5f7fa; min-height: 100vh; }
.header { font-size: 36rpx; font-weight: bold; color: #1a1a1a; padding: 20rpx 0 30rpx; text-align: center; }
.loading { text-align: center; color: #999; padding: 60rpx; }
.empty { text-align: center; padding: 80rpx 40rpx; color: #999; }
.submit-btn { background: #1677ff; color: #fff; border-radius: 8rpx; margin-top: 30rpx; padding: 20rpx 60rpx; font-size: 28rpx; }
.load-more { text-align: center; color: #1677ff; padding: 30rpx; font-size: 28rpx; }
.no-more { text-align: center; color: #bbb; padding: 30rpx; font-size: 24rpx; }
</style>
