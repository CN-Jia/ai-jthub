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
  mpLogin: (code: string) => http.post('/auth/mp-login', { code }),

  // 公开数据
  getOrderTypes: () => http.get('/order-types'),
  getActivities: () => http.get('/activities'),

  // 订单
  createOrder: (data: any) => http.post('/orders', data),
  getMyOrders: (params?: any) => http.get('/orders/my', { params }),
  getOrder: (id: string) => http.get(`/orders/${id}`),
}
