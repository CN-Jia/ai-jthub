import { FastifyInstance } from 'fastify'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import {
  adminListOrders, adminGetOrderDetail, updateOrderStatus,
  addAdminNote, getStats, setQuotedPrice,
} from '../../services/order.service.js'
import { notifyAdminStatusChange } from '../../services/notify.service.js'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'
import { OrderStatus } from '@prisma/client'

export async function adminOrderRoutes(fastify: FastifyInstance) {
  // 统计数据
  fastify.get('/admin/stats', { preHandler: verifyAdmin }, async (_request, reply) => {
    const stats = await getStats()
    return reply.send(successResponse(stats))
  })

  // 订单列表
  fastify.get('/admin/orders', { preHandler: verifyAdmin }, async (request, reply) => {
    const q = request.query as Record<string, string>
    const result = await adminListOrders({
      status: q.status as OrderStatus | undefined,
      keyword: q.keyword,
      page: q.page ? Number(q.page) : 1,
      pageSize: q.pageSize ? Number(q.pageSize) : 20,
    })
    return reply.send(successResponse(result))
  })

  // 订单详情
  fastify.get('/admin/orders/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const order = await adminGetOrderDetail(id)
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.ORDER_NOT_FOUND, '订单不存在'))
    return reply.send(successResponse(order))
  })

  // 更新状态（同时 Server酱 推送管理员）
  fastify.patch('/admin/orders/:id/status', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, remark } = request.body as { status: OrderStatus; remark?: string }
    try {
      const order = await updateOrderStatus(id, status, remark)
      const orderWithType = await prisma.order.findUnique({
        where: { id },
        include: { orderType: true },
      })
      if (orderWithType) {
        notifyAdminStatusChange(orderWithType, status).catch(() => {})
      }
      return reply.send(successResponse({ orderNo: order.orderNo, status: order.status }))
    } catch (err: any) {
      if (err.code === ERROR_CODES.INVALID_STATUS_TRANSITION) {
        return reply.code(422).send(errorResponse(err.code, err.message))
      }
      throw err
    }
  })

  // 添加内部备注
  fastify.post('/admin/orders/:id/note', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { note } = request.body as { note: string }
    if (!note?.trim()) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '备注不能为空'))
    const order = await addAdminNote(id, note.trim())
    return reply.send(successResponse({ adminNote: order.adminNote }))
  })

  // 设置报价
  fastify.post('/admin/orders/:id/quote', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { price } = request.body as { price: string }
    if (!price?.trim()) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '报价不能为空'))
    const order = await setQuotedPrice(id, price.trim())
    return reply.send(successResponse({ quotedPrice: order.quotedPrice }))
  })
}
