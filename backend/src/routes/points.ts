import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'
import { freezePoints } from '../services/points.service.js'

export async function pointsRoutes(fastify: FastifyInstance) {

  // ── 获取我的邀请信息 ────────────────────────────────────────────
  fastify.get('/points/invite', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { inviteCode: true },
    })
    if (!user) return reply.code(404).send(errorResponse(ERROR_CODES.UNAUTHORIZED, '用户不存在'))

    const [totalInvited, completedFirst] = await Promise.all([
      prisma.user.count({ where: { invitedById: userId } }),
      prisma.user.count({
        where: {
          invitedById: userId,
          orders: { some: { status: 'COMPLETED' } },
        },
      }),
    ])

    return reply.send(successResponse({
      inviteCode: user.inviteCode,
      inviteUrl: `https://jthub.cc.cd/register?ref=${user.inviteCode}`,
      totalInvited,
      pendingFirst: totalInvited - completedFirst,
      completedFirst,
    }))
  })

  // ── 获取我邀请的用户列表 ────────────────────────────────────────
  fastify.get('/points/invitees', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const invitees = await prisma.user.findMany({
      where: { invitedById: userId },
      select: {
        nickname: true,
        createdAt: true,
        orders: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send(successResponse({
      list: invitees.map(u => ({
        nickname: u.nickname,
        registeredAt: u.createdAt,
        firstOrderAt: u.orders[0]?.createdAt ?? null,
      })),
    }))
  })

  // ── 获取积分余额 ────────────────────────────────────────────────
  fastify.get('/points/balance', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const balance = await prisma.pointBalance.findUnique({ where: { userId } })
    return reply.send(successResponse({
      totalPoints: balance?.totalPoints ?? 0,
      frozenPoints: balance?.frozenPoints ?? 0,
      availablePoints: (balance?.totalPoints ?? 0),
      lifetimeEarned: balance?.lifetimeEarned ?? 0,
    }))
  })

  // ── 获取积分明细 ────────────────────────────────────────────────
  fastify.get('/points/logs', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const q = request.query as Record<string, string>
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(q.pageSize) || 20))

    const [total, list] = await Promise.all([
      prisma.pointLog.count({ where: { userId } }),
      prisma.pointLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, eventType: true, delta: true, balance: true, remark: true, createdAt: true },
      }),
    ])

    return reply.send(successResponse({ total, list }))
  })

  // ── 商城商品列表（公开）────────────────────────────────────────
  fastify.get('/shop/items', async (request, reply) => {
    const q = request.query as Record<string, string>
    const where: Record<string, unknown> = { isActive: true }
    if (q.type === 'SERVICE' || q.type === 'COUPON') where['type'] = q.type

    const list = await prisma.shopItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true, name: true, description: true, coverUrl: true,
        type: true, pointsCost: true, stock: true, discountAmt: true,
      },
    })

    return reply.send(successResponse({ list }))
  })

  // ── 提交兑换申请 ────────────────────────────────────────────────
  fastify.post('/shop/redeem', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const schema = z.object({ shopItemId: z.string().min(1) })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '参数错误'))

    const { shopItemId } = parse.data

    const item = await prisma.shopItem.findUnique({ where: { id: shopItemId } })
    if (!item || !item.isActive) return reply.code(404).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '商品不存在或已下架'))
    if (item.stock === 0) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '商品库存不足'))

    // 检查是否已有待审核订单
    const pending = await prisma.redeemOrder.findFirst({
      where: { userId, shopItemId, status: 'PENDING' },
    })
    if (pending) return reply.code(409).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '该商品已有待审核的兑换申请'))

    // 检查积分余额
    const balance = await prisma.pointBalance.findUnique({ where: { userId } })
    if (!balance || balance.totalPoints < item.pointsCost) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '积分不足'))
    }

    // 创建兑换订单并冻结积分
    const redeemOrder = await prisma.redeemOrder.create({
      data: { userId, shopItemId, pointsCost: item.pointsCost },
    })

    await freezePoints(userId, item.pointsCost, redeemOrder.id)

    // 扣减库存（有限库存）
    if (item.stock > 0) {
      await prisma.shopItem.update({ where: { id: shopItemId }, data: { stock: { decrement: 1 } } })
    }

    return reply.code(201).send(successResponse({
      redeemOrderId: redeemOrder.id,
      status: 'PENDING',
      frozenPoints: item.pointsCost,
      message: '兑换申请已提交，积分已冻结，等待管理员审核',
    }))
  })

  // ── 我的兑换记录 ────────────────────────────────────────────────
  fastify.get('/shop/redeem/my', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const list = await prisma.redeemOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        shopItem: { select: { name: true, type: true } },
        coupon: { select: { code: true, discountAmt: true, status: true, expiresAt: true } },
      },
    })

    return reply.send(successResponse({
      list: list.map(o => ({
        id: o.id,
        shopItem: o.shopItem,
        pointsCost: o.pointsCost,
        status: o.status,
        adminNote: o.adminNote,
        coupon: o.coupon,
        createdAt: o.createdAt,
      })),
    }))
  })

  // ── 我的优惠券 ──────────────────────────────────────────────────
  fastify.get('/coupons/my', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const list = await prisma.coupon.findMany({
      where: { userId, status: 'UNUSED' },
      orderBy: { expiresAt: 'asc' },
      select: { id: true, code: true, discountAmt: true, status: true, expiresAt: true },
    })
    return reply.send(successResponse({ list }))
  })
}
