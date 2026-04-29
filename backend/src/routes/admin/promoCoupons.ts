import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'

const createSchema = z.object({
  code: z.string().min(1).max(50),
  discountType: z.enum(['FIXED', 'PERCENTAGE']),
  discountValue: z.number().positive(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  maxUses: z.number().int().min(1).default(1),
})

export async function adminPromoCouponRoutes(fastify: FastifyInstance) {
  // ??
  fastify.get('/admin/promo-coupons', { preHandler: verifyAdmin }, async (request, reply) => {
    const q = request.query as Record<string, string>
    const page = Number(q.page ?? 1)
    const pageSize = Number(q.pageSize ?? 20)
    const [list, total] = await Promise.all([
      prisma.promoCoupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.promoCoupon.count(),
    ])
    return reply.send(successResponse({ list, total }))
  })

  // ??
  fastify.post('/admin/promo-coupons', { preHandler: verifyAdmin }, async (request, reply) => {
    const parse = createSchema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    const data = parse.data
    if (new Date(data.validFrom) >= new Date(data.validTo)) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'validTo must be after validFrom'))
    }
    try {
      const coupon = await prisma.promoCoupon.create({
        data: {
          code: data.code.toUpperCase(),
          discountType: data.discountType,
          discountValue: data.discountValue,
          validFrom: new Date(data.validFrom),
          validTo: new Date(data.validTo),
          maxUses: data.maxUses,
        },
      })
      return reply.code(201).send(successResponse(coupon))
    } catch (err: any) {
      if (err.code === 'P2002') return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Coupon code already exists'))
      throw err
    }
  })

  // ?????????????
  fastify.delete('/admin/promo-coupons/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const coupon = await prisma.promoCoupon.findUnique({ where: { id } })
    if (!coupon) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '??????'))
    if (coupon.usedCount > 0) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Coupon has been used, cannot delete'))
    await prisma.promoCoupon.delete({ where: { id } })
    return reply.send(successResponse({ deleted: true }))
  })

  // ??
  fastify.patch('/admin/promo-coupons/:id/deactivate', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const coupon = await prisma.promoCoupon.update({ where: { id }, data: { isActive: false } })
      return reply.send(successResponse({ isActive: coupon.isActive }))
    } catch {
      return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '??????'))
    }
  })

  // ??
  fastify.patch('/admin/promo-coupons/:id/activate', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const coupon = await prisma.promoCoupon.update({ where: { id }, data: { isActive: true } })
      return reply.send(successResponse({ isActive: coupon.isActive }))
    } catch {
      return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '??????'))
    }
  })
}
