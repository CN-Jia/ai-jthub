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
import { awardPoints, isFirstCompletedOrder } from '../../services/points.service.js'

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
    const { status, remark, estimatedDelivery, rewardPoints } = request.body as {
      status: OrderStatus; remark?: string; estimatedDelivery?: string; rewardPoints?: number
    }
    try {
      // IN_PROGRESS 必须填写预计交付时间
      if (status === 'IN_PROGRESS' && !estimatedDelivery) {
        return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '进行中状态必须填写预计交付时间'))
      }

      const order = await updateOrderStatus(id, status, remark)
      const orderWithType = await prisma.order.findUnique({
        where: { id },
        include: { orderType: true, user: { select: { id: true, nickname: true, invitedById: true } } },
      })

      // 更新附加字段
      const updateData: any = {}
      if (status === 'IN_PROGRESS' && estimatedDelivery) {
        updateData.estimatedDelivery = new Date(estimatedDelivery)
      }
      if (status === 'COMPLETED') {
        // 自动计算奖励积分：订单报价 × 订单类型积分比例
        const price = order.quotedPrice ? parseFloat(order.quotedPrice) : 0
        const rate = orderWithType?.orderType?.pointRewardRate ? Number(orderWithType.orderType.pointRewardRate) : 0.05
        const calculatedPoints = Math.floor(price * rate * 100) // 1元=100积分
        updateData.rewardPoints = rewardPoints ?? Math.max(calculatedPoints, 0)
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.order.update({ where: { id }, data: updateData })
      }

      if (orderWithType) {
        notifyAdminStatusChange(orderWithType, status).catch(() => {})
      }

      // 订单完成时触发积分奖励
      if (status === 'COMPLETED' && orderWithType?.userId) {
        const userId = orderWithType.userId
        const finalRewardPoints = updateData.rewardPoints ?? 0

        // 发放订单完成奖励积分
        if (finalRewardPoints > 0) {
          awardPoints(userId, 'ORDER_COMPLETED', id, `订单 ${order.orderNo} 完成奖励`).catch(() => {})
        }

        // 新用户首购奖励
        const isFirst = await isFirstCompletedOrder(userId)
        if (isFirst) {
          awardPoints(userId, 'NEW_USER_FIRST_ORDER', id, '首笔订单完成奖励').catch(() => {})
          const invitedById = orderWithType.user?.invitedById
          if (invitedById) {
            const inviterNickname = orderWithType.user?.nickname ?? '用户'
            awardPoints(invitedById, 'INVITE_FIRST_ORDER', id, `被邀请用户「${inviterNickname}」完成首单`).catch(() => {})
          }
        }
      }

      return reply.send(successResponse({
        orderNo: order.orderNo, status: order.status,
        estimatedDelivery: updateData.estimatedDelivery,
        rewardPoints: updateData.rewardPoints,
      }))
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
