import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import {
  createProductOrder,
  getMyProductOrders,
  getProductOrderDetail,
  assertCanTransition,
} from '../services/productOrder.service.js'
import { createAdminNotification } from '../services/adminNotification.service.js'
import { prisma } from '../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'

const createSchema = z.object({
  productId: z.string().min(1),
  couponCode: z.string().optional(),
  userNote: z.string().max(500).optional(),
})

export async function productOrderRoutes(fastify: FastifyInstance) {
  // 创建订单
  fastify.post('/product-orders', { preHandler: verifyJWT }, async (request, reply) => {
    const parse = createSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    }
    const user = request.user as { userId: string }
    try {
      const order = await createProductOrder({ userId: user.userId, ...parse.data })
      fastify.log.info({ event: 'product_order_created', orderId: order.id, userId: user.userId })
      return reply.code(201).send(successResponse({
        orderId: order.id,
        orderNo: order.orderNo,
        originalPrice: order.originalPrice,
        discountAmount: order.discountAmount,
        paidPrice: order.paidPrice,
        status: order.status,
      }))
    } catch (err: any) {
      const msg: Record<string, string> = {
        PRODUCT_NOT_FOUND: '商品不存在或已下架',
        COUPON_INVALID: '优惠码无效',
        COUPON_EXPIRED: '优惠码已过期',
        COUPON_USED_UP: '优惠码已使用完毕',
      }
      const code = err.message?.split(':')[0]
      if (msg[code]) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, msg[code]))
      throw err
    }
  })

  // 我的订单列表
  fastify.get('/product-orders/my', { preHandler: verifyJWT }, async (request, reply) => {
    const user = request.user as { userId: string }
    const q = request.query as Record<string, string>
    const result = await getMyProductOrders(
      user.userId,
      Number(q.page ?? 1),
      Number(q.pageSize ?? 20),
      q.status as any,
    )
    return reply.send(successResponse(result))
  })

  // 订单详情
  fastify.get('/product-orders/:id', { preHandler: verifyJWT }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = request.user as { userId: string }
    const order = await getProductOrderDetail(id, user.userId)
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '订单不存在'))
    return reply.send(successResponse(order))
  })

  // 用户标记已支付
  fastify.post('/product-orders/:id/pay', { preHandler: verifyJWT }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = request.user as { userId: string }
    const order = await prisma.productOrder.findFirst({ where: { id, userId: user.userId }, include: { product: { select: { name: true } } } })
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '订单不存在'))
    try {
      assertCanTransition(order.status, 'PAID', false)
    } catch {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '当前订单状态不可标记已支付'))
    }
    const updated = await prisma.productOrder.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    })
    // 通知管理员
    const user2 = await prisma.user.findUnique({ where: { id: user.userId }, select: { nickname: true } })
    const summary = `用户 ${user2?.nickname ?? '—'} 已支付订单 ${order.orderNo}（¥${order.paidPrice} · ${order.product.name}）`
    createAdminNotification({ type: 'ORDER_PAID', summary, orderId: id }).catch(() => {})
    fastify.log.info({ event: 'product_order_paid', orderId: id, userId: user.userId })
    return reply.send(successResponse({ status: updated.status, paidAt: updated.paidAt }))
  })

  // 用户取消订单（仅 CREATED 状态）
  fastify.post('/product-orders/:id/cancel', { preHandler: verifyJWT }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = request.user as { userId: string }
    const order = await prisma.productOrder.findFirst({ where: { id, userId: user.userId } })
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '订单不存在'))
    if (order.status !== 'CREATED') {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '只能取消"已创建"状态的订单'))
    }
    await prisma.productOrder.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: '用户主动取消' },
    })
    fastify.log.info({ event: 'product_order_cancelled', orderId: id, userId: user.userId })
    return reply.send(successResponse({ status: 'CANCELLED' }))
  })
}
