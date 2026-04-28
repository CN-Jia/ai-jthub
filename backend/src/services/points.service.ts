import { prisma } from '../lib/prisma.js'
import { PointEventType } from '@prisma/client'

// 生成6位大写字母+数字邀请码，碰撞时自动重试
export async function generateInviteCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    const exists = await prisma.user.findUnique({ where: { inviteCode: code } })
    if (!exists) return code
  }
  throw new Error('Failed to generate unique invite code after 10 attempts')
}

// 根据事件类型查积分规则（首次访问时若无规则则 seed 默认值）
async function getRulePoints(eventType: PointEventType): Promise<number | null> {
  let rule = await prisma.pointRule.findUnique({ where: { eventType } })
  if (!rule) {
    const defaults: Partial<Record<PointEventType, number>> = {
      INVITE_REGISTER: 50,
      INVITE_FIRST_ORDER: 100,
      NEW_USER_FIRST_ORDER: 30,
    }
    const defaultPoints = defaults[eventType]
    if (defaultPoints === undefined) return null
    rule = await prisma.pointRule.upsert({
      where: { eventType },
      create: { eventType, points: defaultPoints },
      update: {},
    })
  }
  if (!rule.enabled) return null
  return rule.points
}

// 发放积分（奖励类事件）
export async function awardPoints(
  userId: string,
  eventType: PointEventType,
  refId?: string,
  remark?: string,
): Promise<void> {
  const points = await getRulePoints(eventType)
  if (points === null || points <= 0) return

  await prisma.$transaction(async (tx) => {
    const balance = await tx.pointBalance.upsert({
      where: { userId },
      create: {
        userId,
        totalPoints: points,
        lifetimeEarned: points,
      },
      update: {
        totalPoints: { increment: points },
        lifetimeEarned: { increment: points },
      },
    })

    await tx.pointLog.create({
      data: {
        userId,
        eventType,
        delta: points,
        balance: balance.totalPoints,
        remark: remark ?? null,
        refId: refId ?? null,
      },
    })
  })
}

// 手动调整积分（管理员操作，delta 可正可负）
export async function adjustPoints(
  userId: string,
  delta: number,
  remark?: string,
): Promise<number> {
  if (delta === 0) throw new Error('Delta must be non-zero')

  return await prisma.$transaction(async (tx) => {
    const current = await tx.pointBalance.findUnique({ where: { userId } })
    const currentTotal = current?.totalPoints ?? 0

    if (delta < 0 && currentTotal + delta < 0) {
      throw new Error('INSUFFICIENT_POINTS')
    }

    const balance = await tx.pointBalance.upsert({
      where: { userId },
      create: {
        userId,
        totalPoints: Math.max(0, delta),
        lifetimeEarned: delta > 0 ? delta : 0,
      },
      update: {
        totalPoints: { increment: delta },
        ...(delta > 0 && { lifetimeEarned: { increment: delta } }),
      },
    })

    await tx.pointLog.create({
      data: {
        userId,
        eventType: PointEventType.ADMIN_ADJUST,
        delta,
        balance: balance.totalPoints,
        remark: remark ?? null,
      },
    })

    return balance.totalPoints
  })
}

// 兑换冻结：totalPoints -= amount, frozenPoints += amount
export async function freezePoints(
  userId: string,
  amount: number,
  redeemOrderId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const balance = await tx.pointBalance.findUnique({ where: { userId } })
    if (!balance || balance.totalPoints < amount) {
      throw new Error('INSUFFICIENT_POINTS')
    }

    await tx.pointBalance.update({
      where: { userId },
      data: {
        totalPoints: { decrement: amount },
        frozenPoints: { increment: amount },
      },
    })

    const updated = await tx.pointBalance.findUnique({ where: { userId } })
    await tx.pointLog.create({
      data: {
        userId,
        eventType: PointEventType.REDEEM_FREEZE,
        delta: -amount,
        balance: updated!.totalPoints,
        refId: redeemOrderId,
        remark: '兑换申请冻结积分',
      },
    })
  })
}

// 审核通过：从 frozenPoints 正式扣减（totalPoints 已在冻结时扣过）
export async function deductFrozen(
  userId: string,
  amount: number,
  redeemOrderId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.pointBalance.update({
      where: { userId },
      data: { frozenPoints: { decrement: amount } },
    })

    const updated = await tx.pointBalance.findUnique({ where: { userId } })
    await tx.pointLog.create({
      data: {
        userId,
        eventType: PointEventType.REDEEM_DEDUCT,
        delta: -amount,
        balance: updated!.totalPoints,
        refId: redeemOrderId,
        remark: '兑换审核通过，积分扣减',
      },
    })
  })
}

// 审核拒绝：解冻积分，totalPoints += amount, frozenPoints -= amount
export async function unfreeze(
  userId: string,
  amount: number,
  redeemOrderId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const balance = await tx.pointBalance.update({
      where: { userId },
      data: {
        totalPoints: { increment: amount },
        frozenPoints: { decrement: amount },
      },
    })

    await tx.pointLog.create({
      data: {
        userId,
        eventType: PointEventType.REDEEM_UNFREEZE,
        delta: amount,
        balance: balance.totalPoints,
        refId: redeemOrderId,
        remark: '兑换审核拒绝，积分解冻归还',
      },
    })
  })
}

// 判断用户是否有首笔完成订单（用于拉新首购积分判断）
export async function isFirstCompletedOrder(userId: string): Promise<boolean> {
  const count = await prisma.order.count({
    where: { userId, status: 'COMPLETED' },
  })
  return count === 1
}
