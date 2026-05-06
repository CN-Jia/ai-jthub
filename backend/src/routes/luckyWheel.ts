import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'

// 生成兑换码: JW-XXYYZZ
function generateRedeemCode(): string {
  const bytes = crypto.randomBytes(3)
  return 'JW-' + bytes.toString('hex').toUpperCase()
}

// 加权随机选择奖品（考虑库存）
function weightedRandom(prizes: any[]): any {
  // 过滤有库存的奖品
  const available = prizes.filter(p => p.totalStock === -1 || p.remainStock > 0)

  // 构建权重列表：NONE 类型权重较高（让谢谢惠顾更常见）
  const weighted: { prize: any; weight: number }[] = []
  for (const p of available) {
    if (p.type === 'NONE') {
      weighted.push({ prize: p, weight: 4 }) // 谢谢惠顾权重高
    } else if (p.type === 'CASH_REDEEM') {
      weighted.push({ prize: p, weight: 1 }) // 现金奖权重低
    } else {
      weighted.push({ prize: p, weight: 2 }) // 折扣券中等权重
    }
  }

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
  let random = Math.random() * totalWeight

  for (const w of weighted) {
    random -= w.weight
    if (random <= 0) return w.prize
  }

  // fallback: 返回最后一个（谢谢惠顾）
  return weighted[weighted.length - 1]?.prize ?? prizes[prizes.length - 1]
}

export async function luckyWheelRoutes(fastify: FastifyInstance) {

  // ── 获取转盘信息 ──────────────────────────────────────────────
  fastify.get('/lucky-wheel/info', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }

    const [prizes, spinResults, inviteCount] = await Promise.all([
      prisma.wheelPrize.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, label: true, type: true, color: true, icon: true },
      }),
      prisma.spinResult.findMany({
        where: { userId },
        orderBy: { spinRound: 'asc' },
        include: { prize: { select: { label: true, type: true } } },
      }),
      prisma.user.count({ where: { invitedById: userId } }),
    ])

    const maxSpins = Math.min(1 + inviteCount, 3)
    const usedSpins = spinResults.length
    const remainingSpins = Math.max(0, maxSpins - usedSpins)

    const history = spinResults.map(r => ({
      prizeLabel: r.prize.label,
      won: r.prize.type !== 'NONE',
      redeemCode: r.redeemCode,
      isRedeemed: r.isRedeemed,
      createdAt: r.createdAt,
    }))

    return reply.send(successResponse({
      prizes,
      remainingSpins,
      maxSpins,
      history,
    }))
  })

  // ── 执行抽奖 ──────────────────────────────────────────────────
  fastify.post('/lucky-wheel/spin', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. 检查剩余次数
        const spinCount = await tx.spinResult.count({ where: { userId } })
        const inviteCount = await tx.user.count({ where: { invitedById: userId } })
        const maxSpins = Math.min(1 + inviteCount, 3)

        if (spinCount >= maxSpins) {
          throw new Error('NO_SPINS_LEFT')
        }

        // 2. 获取奖品列表
        const prizes = await tx.wheelPrize.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        })

        if (prizes.length === 0) {
          throw new Error('NO_PRIZES')
        }

        // 3. 加权随机选择
        const winner = weightedRandom(prizes)

        // 4. 扣减库存
        if (winner.totalStock !== -1) {
          await tx.wheelPrize.update({
            where: { id: winner.id },
            data: { remainStock: { decrement: 1 } },
          })
        }

        // 5. 生成兑换码（现金类奖品）
        let redeemCode: string | null = null
        if (winner.type === 'CASH_REDEEM') {
          // 生成唯一兑换码
          for (let i = 0; i < 10; i++) {
            const code = generateRedeemCode()
            const exists = await tx.spinResult.findUnique({ where: { redeemCode: code } })
            if (!exists) {
              redeemCode = code
              break
            }
          }
          if (!redeemCode) throw new Error('CODE_GENERATION_FAILED')
        }

        // 6. 记录抽奖结果
        await tx.spinResult.create({
          data: {
            userId,
            prizeId: winner.id,
            spinRound: spinCount + 1,
            redeemCode,
          },
        })

        // 7. 找到中奖扇区索引
        const prizeIndex = prizes.findIndex(p => p.id === winner.id)

        return {
          prizeIndex,
          prize: {
            id: winner.id,
            label: winner.label,
            type: winner.type,
            value: winner.value,
            icon: winner.icon,
          },
          won: winner.type !== 'NONE',
          redeemCode,
          remainingSpins: maxSpins - spinCount - 1,
        }
      })

      return reply.send(successResponse(result))
    } catch (err: any) {
      if (err.message === 'NO_SPINS_LEFT') {
        return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '抽奖次数已用完'))
      }
      if (err.message === 'NO_PRIZES') {
        return reply.code(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, '暂无可用奖品'))
      }
      throw err
    }
  })

  // ── 获取浮窗配置（公开）────────────────────────────────────────
  fastify.get('/activity-popup', async (_request, reply) => {
    const popup = await prisma.activityPopup.findUnique({ where: { id: 'singleton' } })
    if (!popup || !popup.enabled) {
      return reply.send(successResponse({ enabled: false }))
    }
    return reply.send(successResponse({
      enabled: true,
      title: popup.title,
      description: popup.description,
      buttonText: popup.buttonText,
      linkUrl: popup.linkUrl,
      imageUrl: popup.imageUrl,
      showCondition: popup.showCondition,
    }))
  })
}
