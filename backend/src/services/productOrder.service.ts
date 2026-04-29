import { prisma } from '../lib/prisma.js'
import { Prisma, ProductOrderStatus } from '@prisma/client'

export function generateOrderNo(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `ORD-${date}-${rand}`
}

export function assertCanTransition(
  current: ProductOrderStatus,
  next: ProductOrderStatus,
  isAdmin: boolean,
): void {
  const allowed: Record<ProductOrderStatus, ProductOrderStatus[]> = {
    CREATED: isAdmin ? ['PAID', 'CANCELLED'] : ['PAID', 'CANCELLED'],
    PAID: isAdmin ? ['COMPLETED', 'CANCELLED'] : [],
    COMPLETED: [],
    CANCELLED: [],
  }
  if (!allowed[current].includes(next)) {
    throw new Error(`ORDER_STATUS_INVALID: cannot transition from ${current} to ${next}`)
  }
}

export async function createProductOrder(params: {
  userId: string
  productId: string
  couponCode?: string
  userNote?: string
}) {
  const { userId, productId, couponCode, userNote } = params

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product || !product.isActive) throw new Error('PRODUCT_NOT_FOUND')

  const originalPrice = product.price
  let discountAmount = new Prisma.Decimal(0)
  let paidPrice = originalPrice
  let couponId: string | undefined

  if (couponCode) {
    const coupon = await prisma.promoCoupon.findUnique({ where: { code: couponCode } })
    if (!coupon || !coupon.isActive) throw new Error('COUPON_INVALID')
    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validTo) throw new Error('COUPON_EXPIRED')
    if (coupon.usedCount >= coupon.maxUses) throw new Error('COUPON_USED_UP')

    if (coupon.discountType === 'FIXED') {
      discountAmount = Prisma.Decimal.min(coupon.discountValue, originalPrice)
    } else {
      discountAmount = originalPrice.mul(coupon.discountValue).div(100).toDecimalPlaces(2)
    }
    paidPrice = Prisma.Decimal.max(originalPrice.sub(discountAmount), new Prisma.Decimal(0))
    couponId = coupon.id
  }

  const orderNo = generateOrderNo()

  const order = await prisma.$transaction(async (tx) => {
    if (couponId) {
      const coupon = await tx.promoCoupon.findUnique({ where: { id: couponId } })
      if (!coupon || coupon.usedCount >= coupon.maxUses) throw new Error('COUPON_USED_UP')
      await tx.promoCoupon.update({
        where: { id: couponId, version: coupon.version },
        data: { usedCount: { increment: 1 }, version: { increment: 1 } },
      })
    }

    return tx.productOrder.create({
      data: {
        orderNo,
        userId,
        productId,
        couponId: couponId ?? null,
        originalPrice,
        discountAmount,
        paidPrice,
        userNote,
        status: 'CREATED',
      },
      include: { product: { select: { name: true } } },
    })
  })

  return order
}

export async function getMyProductOrders(
  userId: string,
  page: number,
  pageSize: number,
  status?: ProductOrderStatus,
) {
  const where: Prisma.ProductOrderWhereInput = {
    userId,
    ...(status ? { status } : {}),
  }
  const [list, total] = await Promise.all([
    prisma.productOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: { select: { id: true, name: true, imageUrl: true } },
      },
    }),
    prisma.productOrder.count({ where }),
  ])
  return { list, total }
}

export async function getProductOrderDetail(id: string, userId?: string) {
  return prisma.productOrder.findFirst({
    where: { id, ...(userId ? { userId } : {}) },
    include: {
      product: true,
      coupon: { select: { code: true, discountType: true, discountValue: true } },
    },
  })
}
