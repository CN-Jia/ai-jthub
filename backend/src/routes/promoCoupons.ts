import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { prisma } from '../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'
import { Prisma } from '@prisma/client'

const validateSchema = z.object({
  code: z.string().min(1),
  productId: z.string().min(1),
})

export async function promoCouponRoutes(fastify: FastifyInstance) {
  // 校验优惠码并预览折扣（不消耗次数）
  fastify.post('/promo-coupons/validate', { preHandler: verifyJWT }, async (request, reply) => {
    const parse = validateSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    }
    const { code, productId } = parse.data

    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } })
    if (!product) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '商品不存在'))

    const coupon = await prisma.promoCoupon.findUnique({ where: { code } })
    if (!coupon || !coupon.isActive) {
      return reply.send(successResponse({ valid: false, reason: 'NOT_FOUND' }))
    }
    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validTo) {
      return reply.send(successResponse({ valid: false, reason: 'EXPIRED' }))
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return reply.send(successResponse({ valid: false, reason: 'USED_UP' }))
    }

    const originalPrice = product.price
    let discountAmount: Prisma.Decimal
    if (coupon.discountType === 'FIXED') {
      discountAmount = Prisma.Decimal.min(coupon.discountValue, originalPrice)
    } else {
      discountAmount = originalPrice.mul(coupon.discountValue).div(100).toDecimalPlaces(2)
    }
    const paidPrice = Prisma.Decimal.max(originalPrice.sub(discountAmount), new Prisma.Decimal(0))

    return reply.send(successResponse({
      valid: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      originalPrice: originalPrice,
      discountAmount,
      paidPrice,
    }))
  })
}
