import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { createOrder, getMyOrders, getOrderDetail } from '../services/order.service.js'
import { notifyAdminNewOrder } from '../services/notify.service.js'
import { prisma } from '../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'
import { env } from '../config/env.js'

const createOrderSchema = z.object({
  courseName: z.string().min(1).max(200),
  orderTypeId: z.string().min(1),
  grade: z.enum(['FRESHMAN', 'SOPHOMORE', 'JUNIOR']),
  deadline: z.string().datetime(),
  contactWechat: z.string().min(1).max(100),
  source: z.enum(['MINIPROGRAM', 'PC']),
  redeemItemId: z.string().optional(),
})

export async function orderRoutes(fastify: FastifyInstance) {
  // 获取需求类型列表（公开）
  fastify.get('/order-types', async (_request, reply) => {
    const types = await prisma.orderType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, description: true, price: true },
    })
    return reply.send(successResponse(types))
  })

  // 获取活动/公告列表（公开，含已过期活动，支持分页）
  fastify.get('/activities', async (request, reply) => {
    const now = new Date()
    const q = request.query as Record<string, string>
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(Math.max(1, Number(q.pageSize) || 20), 50)
    const skip = (page - 1) * pageSize
    const typeFilter = q.type ? { type: q.type as 'PROMO' | 'NOTICE' } : {}

    const [list, total] = await Promise.all([
      prisma.activity.findMany({
        where: {
          isActive: true,
          startAt: { lte: now },
          ...typeFilter,
        },
        orderBy: { startAt: 'desc' },
        skip,
        take: pageSize,
        select: { id: true, title: true, content: true, type: true, startAt: true, endAt: true },
      }),
      prisma.activity.count({
        where: { isActive: true, startAt: { lte: now }, ...typeFilter },
      }),
    ])

    const enriched = list.map(item => {
      const isExpired = item.endAt != null && item.endAt < now
      const daysLeft = item.endAt == null
        ? null
        : isExpired
          ? 0
          : Math.ceil((item.endAt.getTime() - now.getTime()) / 86_400_000)
      return { ...item, isExpired, daysLeft }
    })

    return reply.send(successResponse({ list: enriched, total, page, pageSize }))
  })

  // 创建订单（需 JWT 登录）
  fastify.post('/orders', { preHandler: verifyJWT }, async (request, reply) => {
    const parse = createOrderSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    }
    const data = parse.data
    const user = request.user as { userId: string }

    // 验证截止日期必须为未来时间
    if (new Date(data.deadline) <= new Date()) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '截止日期必须是未来时间'))
    }

    // 验证 orderTypeId 存在且处于激活状态
    const orderType = await prisma.orderType.findUnique({ where: { id: data.orderTypeId } })
    if (!orderType || !orderType.isActive) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '无效的需求类型'))
    }

    const order = await createOrder({
      ...data,
      deadline: new Date(data.deadline),
      userId: user.userId,
      redeemItemId: data.redeemItemId,
    })

    // 异步通知管理员
    const orderWithType = { ...order, orderType }
    notifyAdminNewOrder(orderWithType).catch(() => {})

    return reply.send(successResponse({
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      createdAt: order.createdAt,
      adminWechatId: env.ADMIN_WECHAT_ID,
    }))
  })

  // 我的订单列表（需 JWT）
  fastify.get('/orders/my', { preHandler: verifyJWT }, async (request, reply) => {
    const user = request.user as { userId: string }
    const { page = '1', pageSize = '20', status } = request.query as Record<string, string>
    const result = await getMyOrders(user.userId, Number(page), Number(pageSize), status as any)
    return reply.send(successResponse(result))
  })

  // 订单详情（需 JWT）
  fastify.get('/orders/:id', { preHandler: verifyJWT }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = request.user as { userId: string; role?: string }
    const order = await getOrderDetail(id, user.role === 'admin' ? undefined : user.userId)
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.ORDER_NOT_FOUND, '订单不存在'))
    return reply.send(successResponse({ ...order, adminNote: undefined }))
  })
}
