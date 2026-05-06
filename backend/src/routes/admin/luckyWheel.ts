import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'

export async function adminLuckyWheelRoutes(fastify: FastifyInstance) {

  // ── 奖品列表 ──────────────────────────────────────────────────
  fastify.get('/admin/wheel/prizes', { preHandler: [verifyAdmin] }, async (_req, reply) => {
    const prizes = await prisma.wheelPrize.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { spinResults: true } } },
    })
    return reply.send(successResponse(prizes))
  })

  // ── 修改奖品 ──────────────────────────────────────────────────
  const updatePrizeSchema = z.object({
    label: z.string().min(1).max(50).optional(),
    value: z.number().min(0).optional().nullable(),
    totalStock: z.number().int().min(-1).optional(),
    remainStock: z.number().int().min(-1).optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }).strip() // 忽略多余字段（如 type）

  fastify.put('/admin/wheel/prizes/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parse = updatePrizeSchema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '参数错误'))

    const prize = await prisma.wheelPrize.update({ where: { id }, data: parse.data })
    return reply.send(successResponse(prize))
  })

  // ── 抽奖记录列表 ──────────────────────────────────────────────
  fastify.get('/admin/wheel/results', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const q = request.query as Record<string, string>
    const page = Math.max(1, Number(q.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(q.pageSize) || 20))

    const [total, list] = await Promise.all([
      prisma.spinResult.count(),
      prisma.spinResult.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { nickname: true, username: true } },
          prize: { select: { label: true, type: true, value: true } },
        },
      }),
    ])

    return reply.send(successResponse({
      total,
      list: list.map(r => ({
        id: r.id,
        nickname: r.user.nickname,
        username: r.user.username,
        prizeLabel: r.prize.label,
        prizeType: r.prize.type,
        prizeValue: r.prize.value,
        spinRound: r.spinRound,
        redeemCode: r.redeemCode,
        isRedeemed: r.isRedeemed,
        createdAt: r.createdAt,
      })),
    }))
  })

  // ── 核销兑换码 ────────────────────────────────────────────────
  fastify.post('/admin/wheel/redeem/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const result = await prisma.spinResult.findUnique({ where: { id } })
    if (!result) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '记录不存在'))
    if (!result.redeemCode) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '该记录无兑换码'))
    if (result.isRedeemed) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '该兑换码已核销'))

    await prisma.spinResult.update({
      where: { id },
      data: { isRedeemed: true },
    })

    return reply.send(successResponse({ message: '兑换码已核销' }))
  })

  // ── 转盘统计 ──────────────────────────────────────────────────
  fastify.get('/admin/wheel/stats', { preHandler: [verifyAdmin] }, async (_req, reply) => {
    const [totalSpins, prizeStats, totalUsers, redeemedCount] = await Promise.all([
      prisma.spinResult.count(),
      prisma.spinResult.groupBy({
        by: ['prizeId'],
        _count: { id: true },
      }),
      prisma.spinResult.findMany({
        distinct: ['userId'],
        select: { userId: true },
      }).then(r => r.length),
      prisma.spinResult.count({ where: { isRedeemed: true } }),
    ])

    // 获取奖品详情
    const prizes = await prisma.wheelPrize.findMany({
      select: { id: true, label: true, type: true },
    })
    const prizeMap = new Map(prizes.map(p => [p.id, p]))

    const prizeBreakdown = prizeStats.map(ps => ({
      label: prizeMap.get(ps.prizeId)?.label ?? '未知',
      type: prizeMap.get(ps.prizeId)?.type ?? '未知',
      count: ps._count.id,
    }))

    return reply.send(successResponse({
      totalSpins,
      totalUsers,
      redeemedCount,
      prizeBreakdown,
    }))
  })

  // ── 获取活动浮窗配置 ──────────────────────────────────────────
  fastify.get('/admin/activity-popup', { preHandler: [verifyAdmin] }, async (_req, reply) => {
    let popup = await prisma.activityPopup.findUnique({ where: { id: 'singleton' } })
    if (!popup) {
      popup = await prisma.activityPopup.create({ data: { id: 'singleton' } })
    }
    return reply.send(successResponse(popup))
  })

  // ── 更新活动浮窗配置 ──────────────────────────────────────────
  const updatePopupSchema = z.object({
    enabled: z.boolean().optional(),
    title: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    buttonText: z.string().max(50).optional(),
    linkUrl: z.string().max(200).optional(),
    imageUrl: z.string().url().optional().nullable().or(z.literal('')),
    showCondition: z.enum(['all', 'new_user', 'has_spins']).optional(),
  }).transform(data => ({
    ...data,
    imageUrl: data.imageUrl || null, // 空字符串转 null
  }))

  fastify.put('/admin/activity-popup', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const parse = updatePopupSchema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '参数错误'))

    const popup = await prisma.activityPopup.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...parse.data },
      update: parse.data,
    })

    return reply.send(successResponse(popup))
  })
}
