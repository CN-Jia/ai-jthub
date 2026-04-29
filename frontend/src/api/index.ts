import axios from 'axios'
import { useUserStore } from '../store/user'
import router from '../router'

const http = axios.create({ baseURL: '/api', timeout: 30000 })

http.interceptors.request.use((config) => {
  const store = useUserStore()
  if (store.token) config.headers.Authorization = `Bearer ${store.token}`
  return config
})

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      useUserStore().logout()
      router.push('/login')
    }
    return Promise.reject(err.response?.data?.error ?? err)
  }
)

export const api = {
  // 认证
  sendCode: (email: string) => http.post('/auth/send-code', { email }),
  register: (data: any) => http.post('/auth/register', data),
  login: (identifier: string, password: string) => http.post('/auth/login', { identifier, password }),
  getMe: () => http.get('/auth/me'),
  updateProfile: (data: any) => http.put('/auth/profile', data),
  changePassword: (oldPassword: string, newPassword: string) => http.put('/auth/password', { oldPassword, newPassword }),

  // 健康/运行时长
  getHealth: () => http.get('/health', { baseURL: '' }),

  // 公开数据
  getOrderTypes: () => http.get('/order-types'),
  getActivities: () => http.get('/activities'),
  getCarousel: () => http.get('/carousel'),

  // 订单
  createOrder: (data: any) => http.post('/orders', data),
  getMyOrders: (params?: any) => http.get('/orders/my', { params }),
  getOrder: (id: string) => http.get(`/orders/${id}`),

  // 论坛
  getPosts: (params?: any) => http.get('/posts', { params }),
  getPost: (id: string) => http.get(`/posts/${id}`),
  createPost: (data: any) => http.post('/posts', data),
  createComment: (postId: string, content: string) => http.post(`/posts/${postId}/comments`, { content }),

  // 反馈
  submitFeedback: (data: any) => http.post('/feedback', data),
  getMyFeedbacks: (params?: any) => http.get('/feedback/my', { params }),
  getFeedbackDetail: (id: string) => http.get(`/feedback/${id}`),

  // 积分/邀请
  getInviteInfo: () => http.get('/points/invite'),
  getInvitees: () => http.get('/points/invitees'),
  getPointBalance: () => http.get('/points/balance'),
  getPointLogs: (params?: any) => http.get('/points/logs', { params }),
  getMyCoupons: () => http.get('/coupons/my'),

  // 积分商城
  getShopItems: (params?: any) => http.get('/shop/items', { params }),
  submitRedeem: (shopItemId: string) => http.post('/shop/redeem', { shopItemId }),
  getMyRedeems: () => http.get('/shop/redeem/my'),
}
