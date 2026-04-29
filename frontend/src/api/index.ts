import axios from 'axios'
import { useUserStore } from '../store/user'
import router from '../router'

const http = axios.create({ baseURL: '/api', timeout: 30000 })

http.interceptors.request.use((config) => {
  const store = useUserStore()
  if (store.token) config.headers.Authorization = `Bearer ${store.token}`
  return config
})

const FRIENDLY_ERRORS: Record<string, string> = {
  COUPON_INVALID: '优惠码无效',
  COUPON_EXPIRED: '优惠码已过期',
  COUPON_USED_UP: '优惠码已使用完毕',
  ORDER_STATUS_INVALID: '订单状态不允许此操作',
  PRODUCT_NOT_FOUND: '商品不存在或已下架',
}

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      useUserStore().logout()
      router.push('/login')
    }
    const apiError = err.response?.data?.error
    if (apiError?.code && FRIENDLY_ERRORS[apiError.code]) {
      return Promise.reject({ ...apiError, message: FRIENDLY_ERRORS[apiError.code] })
    }
    return Promise.reject(apiError ?? err)
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

  // 论坛
  getPosts: (params?: any) => http.get('/posts', { params }),
  getPost: (id: string) => http.get(`/posts/${id}`),
  createPost: (data: any) => http.post('/posts', data),
  createComment: (postId: string, content: string) => http.post(`/posts/${postId}/comments`, { content }),
  deleteMyComment: (postId: string, commentId: string) => http.delete(`/posts/${postId}/comments/${commentId}`),

  // 商品与新版订单
  getProducts: () => http.get('/products'),
  getProduct: (id: string) => http.get(`/products/${id}`),
  getPaymentConfig: () => http.get('/payment-config'),
  createProductOrder: (data: any) => http.post('/product-orders', data),
  getMyProductOrders: (params?: any) => http.get('/product-orders/my', { params }),
  getProductOrder: (id: string) => http.get(`/product-orders/${id}`),
  payProductOrder: (id: string) => http.post(`/product-orders/${id}/pay`),
  cancelProductOrder: (id: string) => http.post(`/product-orders/${id}/cancel`),
  validateCoupon: (code: string, productId: string) => http.post('/promo-coupons/validate', { code, productId }),

  // 旧版订单（兼容旧页面）
  createOrder: (data: any) => http.post('/orders', data),
  getMyOrders: () => http.get('/orders/my'),
  getOrder: (id: string) => http.get(`/orders/${id}`),

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
