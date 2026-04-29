import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'
import { createAdminNotification } from '../../services/adminNotification.service.js'
import { Prisma } from '@prisma/client'

export async function adminProductOrderRoutes(fastify: FastifyInstance) {
  // ????????? - must be before /:id route
  fastify.get('/admin/product-orders/stats', { preHandler: verifyAdmin }, async (_req, reply) => {
    const rows = await prisma.productOrder.groupBy({
      by: ['status'],
      _count: { id: true },
    })
    const stats: Record<string, number> = {}
    rows.forEach(r => { stats[r.status] = r._count.id })
    return reply.send(successResponse(stats))
  })

  // ???????+???
  fastify.get('/admin/product-orders', { preHandler: verifyAdmin }, async (request, reply) => {
    const q = request.query as Record<string, string>
    const page = Number(q.page ?? 1)
    const pageSize = Number(q.pageSize ?? 20)
    const where: Prisma.ProductOrderWhereInput = {}
    if (q.status) where.status = q.status as any
    if (q.keyword) {
      where.OR = [
        { orderNo: { contains: q.keyword, mode: 'insensitive' } },
        { user: { nickname: { contains: q.keyword, mode: 'insensitive' } } },
        { product: { name: { contains: q.keyword, mode: 'insensitive' } } },
      ]
    }
    const [list, total] = await Promise.all([
      prisma.productOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, nickname: true, email: true } },
          product: { select: { id: true, name: true } },
        },
      }),
      prisma.productOrder.count({ where }),
    ])
    return reply.send(successResponse({ list, total }))
  })

  // ????
  fastify.get('/admin/product-orders/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true, email: true, wechatId: true } },
        product: true,
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
    })
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '?????'))
    return reply.send(successResponse(order))
  })

  // ?????PAID -> COMPLETED?
  fastify.put('/admin/product-orders/:id/complete', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const order = await prisma.productOrder.findUnique({ where: { id } })
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '?????'))
    if (order.status !== 'PAID') {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '????????????'))
    }
    const updated = await prisma.productOrder.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
    fastify.log.info({ event: 'product_order_completed', orderId: id })
    return reply.send(successResponse({ status: updated.status }))
  })

  // ????
  fastify.put('/admin/product-orders/:id/cancel', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parse = z.object({ reason: z.string().optional() }).safeParse(request.body)
    const reason = parse.success ? (parse.data.reason ?? 'Admin cancel') : 'Admin cancel'
    const order = await prisma.productOrder.findUnique({ where: { id } })
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '?????'))
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '?????????'))
    }
    const updated = await prisma.productOrder.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
    })
    createAdminNotification({ type: 'ORDER_CANCELLED', summary: `Order ${order.orderNo} cancelled by admin`, orderId: id }).catch(() => {})
    fastify.log.info({ event: 'product_order_cancelled_by_admin', orderId: id })
    return reply.send(successResponse({ status: updated.status }))
  })
}
