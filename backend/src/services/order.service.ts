import { Order, OrderStatus, OrderSource, Grade } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { generateOrderNo } from '../utils/order-id.js'
import { isValidTransition, STATUS_LABELS } from '../utils/order-status.js'
import { ERROR_CODES } from '../utils/response.js'

export interface CreateOrderInput {
  courseName: string
  orderTypeId: string
  grade: Grade
  deadline: Date
  contactWechat: string
  source: OrderSource
  userId?: string
  redeemItemId?: string
  couponId?: string
}

/** 创建订单 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orderNo = generateOrderNo()
  return prisma.$transaction(async (tx) => {
    let quotedPrice: string | undefined
    const notes: string[] = []

    // 验证并使用服务套餐兑换（含转盘中奖折扣）
    if (input.redeemItemId && input.userId) {
      const redeemOrder = await tx.redeemOrder.findFirst({
        where: {
          id: input.redeemItemId,
          userId: input.userId,
          status: 'COMPLETED',
          usedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          shopItem: { select: { name: true, discountAmt: true } },
          coupon: { select: { discountAmt: true } },
        },
      })
      if (!redeemOrder) {
        throw Object.assign(new Error('服务套餐不可用或已过期'), { code: ERROR_CODES.VALIDATION_ERROR })
      }

      // 兼容：shopItem 来自积分商城；coupon 来自转盘中奖折扣
      const itemName = redeemOrder.shopItem?.name ?? redeemOrder.prizeName ?? '转盘奖品'
      const rawDiscount = redeemOrder.shopItem?.discountAmt ?? redeemOrder.coupon?.discountAmt
      const discountAmt = rawDiscount ? Number(rawDiscount) : 0

      if (discountAmt === 0) {
        // 免费兑换：立即标记为 ¥0，无需付款
        quotedPrice = '0'
        notes.push(`[服务套餐: ${itemName}（免费兑换）]`)
      } else {
        // 折扣：等管理员报价后自动扣减
        notes.push(`[服务套餐: ${itemName}（折扣¥${discountAmt}）]`)
      }
    }

    const order = await tx.order.create({
      data: {
        orderNo,
        courseName: input.courseName,
        orderTypeId: input.orderTypeId,
        grade: input.grade,
        deadline: input.deadline,
        contactWechat: input.contactWechat,
        source: input.source,
        status: 'PENDING',
        userId: input.userId ?? null,
        redeemItemId: input.redeemItemId ?? null,
        adminNote: notes.length > 0 ? notes.join(' ') : null,
        ...(quotedPrice !== undefined && { quotedPrice }),
      },
    })

    // 标记兑换记录已使用
    if (input.redeemItemId) {
      await tx.redeemOrder.update({
        where: { id: input.redeemItemId },
        data: { usedAt: new Date(), usedOrderId: order.id },
      })
    }

    await tx.statusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: 'PENDING',
        operator: 'system',
        remark: '订单创建',
      },
    })
    return order
  })
}

/** 小程序端查询该用户的订单列表 */
export async function getMyOrders(userId: string, page = 1, pageSize = 20, status?: OrderStatus) {
  const skip = (page - 1) * pageSize
  const where = { userId, ...(status ? { status } : {}) }
  const [list, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true, orderNo: true, courseName: true, status: true,
        grade: true, deadline: true, createdAt: true, quotedPrice: true,
        orderType: { select: { name: true, price: true } },
      },
    }),
    prisma.order.count({ where }),
  ])
  return { list, total, page, pageSize }
}

/** 查询单个订单详情（用户视角，不含 adminNote） */
export async function getOrderDetail(orderId: string, userId?: string) {
  const where = userId ? { id: orderId, userId } : { id: orderId }
  const order = await prisma.order.findFirst({
    where,
    include: {
      orderType: { select: { id: true, name: true, price: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!order) return null

  // 附加服务套餐信息（用于前端展示折扣/免费标识）
  let redeemService: { name: string; discountAmt: number; isFree: boolean } | null = null
  if (order.redeemItemId) {
    const redeemOrder = await prisma.redeemOrder.findUnique({
      where: { id: order.redeemItemId },
      include: {
        shopItem: { select: { name: true, discountAmt: true } },
        coupon: { select: { discountAmt: true } },
      },
    })
    if (redeemOrder) {
      const itemName = redeemOrder.shopItem?.name ?? redeemOrder.prizeName ?? '转盘奖品'
      const rawDiscount = redeemOrder.shopItem?.discountAmt ?? redeemOrder.coupon?.discountAmt
      const discountAmt = rawDiscount ? Number(rawDiscount) : 0
      redeemService = { name: itemName, discountAmt, isFree: discountAmt === 0 }
    }
  }

  return { ...order, redeemService }
}

/** 管理员查询订单列表（含各状态汇总） */
export async function adminListOrders(filters: {
  status?: OrderStatus
  keyword?: string
  page?: number
  pageSize?: number
}) {
  const { status, keyword, page = 1, pageSize = 20 } = filters
  const skip = (page - 1) * pageSize
  const where = {
    ...(status ? { status } : {}),
    ...(keyword ? {
      OR: [
        { courseName: { contains: keyword, mode: 'insensitive' as const } },
        { orderNo: { contains: keyword, mode: 'insensitive' as const } },
        { contactWechat: { contains: keyword, mode: 'insensitive' as const } },
      ],
    } : {}),
  }
  const [list, total, pending, accepted, inProgress, completed, closed] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: { orderType: { select: { name: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'ACCEPTED' } }),
    prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.count({ where: { status: 'CLOSED' } }),
  ])
  return {
    list, total, page, pageSize,
    stats: { PENDING: pending, ACCEPTED: accepted, IN_PROGRESS: inProgress, COMPLETED: completed, CLOSED: closed },
  }
}

/** 管理员查看订单完整详情 */
export async function adminGetOrderDetail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderType: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      notifications: { orderBy: { createdAt: 'desc' } },
    },
  })
}

/** 管理员更新订单状态 */
export async function updateOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  remark?: string
): Promise<Order> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
  if (!isValidTransition(order.status, toStatus)) {
    throw Object.assign(new Error(ERROR_CODES.INVALID_STATUS_TRANSITION), {
      code: ERROR_CODES.INVALID_STATUS_TRANSITION,
      message: `${STATUS_LABELS[order.status]} 不能变更为 ${STATUS_LABELS[toStatus]}`,
    })
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: toStatus },
    })
    await tx.statusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        operator: 'admin',
        remark: remark ?? null,
      },
    })
    return updated
  })
}

/** 管理员添加内部备注 */
export async function addAdminNote(orderId: string, note: string): Promise<Order> {
  return prisma.order.update({ where: { id: orderId }, data: { adminNote: note } })
}

/** 管理员设置报价（若订单含折扣服务，自动扣减折扣） */
export async function setQuotedPrice(orderId: string, price: string): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('订单不存在')

  let finalPrice = price
  let noteAddition = ''

  if (order.redeemItemId) {
    const redeemOrder = await prisma.redeemOrder.findUnique({
      where: { id: order.redeemItemId },
      include: {
        shopItem: { select: { discountAmt: true } },
        coupon: { select: { discountAmt: true } },
      },
    })
    const rawDiscount = redeemOrder?.shopItem?.discountAmt ?? redeemOrder?.coupon?.discountAmt
    const discountAmt = rawDiscount ? Number(rawDiscount) : 0
    if (discountAmt > 0) {
      const original = parseFloat(price)
      const final = Math.max(0, original - discountAmt)
      finalPrice = final.toFixed(2)
      noteAddition = ` [原价¥${price}，折扣抵扣¥${discountAmt}，实付¥${finalPrice}]`
    }
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      quotedPrice: finalPrice,
      ...(noteAddition ? { adminNote: (order.adminNote ?? '') + noteAddition } : {}),
    },
  })
}

/** 获取统计数据 */
export async function getStats() {
  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0)

  const [
    pending, accepted, inProgress, completed, closed,
    todayNew, todayCompleted,
    weekNew, weekCompleted,
    total,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'ACCEPTED' } }),
    prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.count({ where: { status: 'CLOSED' } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { status: 'COMPLETED', updatedAt: { gte: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.count({ where: { status: 'COMPLETED', updatedAt: { gte: weekStart } } }),
    prisma.order.count({}),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, orderNo: true, courseName: true, status: true, createdAt: true,
        orderType: { select: { name: true } },
      },
    }),
  ])

  return {
    today: { new: todayNew, completed: todayCompleted },
    thisWeek: { new: weekNew, completed: weekCompleted },
    total,
    byStatus: { PENDING: pending, ACCEPTED: accepted, IN_PROGRESS: inProgress, COMPLETED: completed, CLOSED: closed },
    recentOrders,
  }
}
