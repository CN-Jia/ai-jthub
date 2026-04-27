import { request } from '../utils/request'

export const orderApi = {
  create: (data: Record<string, any>) =>
    request({ url: '/api/orders', method: 'POST', data }),

  query: (orderNo: string, email: string) =>
    request({ url: '/api/orders/query', method: 'POST', data: { orderNo, email } }),

  myOrders: (page = 1) =>
    request({ url: `/api/orders/my?page=${page}`, method: 'GET' }),

  detail: (id: string) =>
    request({ url: `/api/orders/${id}`, method: 'GET' }),
}
