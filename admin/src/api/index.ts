import axios from 'axios'
import { useAdminStore } from '../store/admin'
import router from '../router'

const http = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

http.interceptors.request.use((config) => {
  const store = useAdminStore()
  if (store.token) config.headers.Authorization = `Bearer ${store.token}`
  return config
})

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      useAdminStore().logout()
      router.push('/login')
    }
    return Promise.reject(err.response?.data?.error ?? err)
  }
)

export const api = {
  // 认证
  login: (username: string, password: string) =>
    http.post('/auth/admin-login', { username, password }),

  // 统计
  getStats: () => http.get('/admin/stats'),

  // 订单
  getOrders: (params?: Record<string, any>) =>
    http.get('/admin/orders', { params }),
  getOrder: (id: string) => http.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string, remark?: string) =>
    http.patch(`/admin/orders/${id}/status`, { status, remark }),
  addNote: (id: string, note: string) =>
    http.post(`/admin/orders/${id}/note`, { note }),
  setQuote: (id: string, price: string) =>
    http.post(`/admin/orders/${id}/quote`, { price }),

  // 需求类型
  getOrderTypes: () => http.get('/admin/order-types'),
  createOrderType: (data: any) => http.post('/admin/order-types', data),
  updateOrderType: (id: string, data: any) => http.put(`/admin/order-types/${id}`, data),
  deleteOrderType: (id: string) => http.delete(`/admin/order-types/${id}`),

  // 活动管理
  getActivities: () => http.get('/admin/activities'),
  createActivity: (data: any) => http.post('/admin/activities', data),
  updateActivity: (id: string, data: any) => http.put(`/admin/activities/${id}`, data),
  deleteActivity: (id: string) => http.delete(`/admin/activities/${id}`),
}
