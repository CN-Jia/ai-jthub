import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'

const updateSchema = z.object({
  wechatUrl: z.string().optional(),
  alipayUrl: z.string().optional(),
})

export async function adminPaymentConfigRoutes(fastify: FastifyInstance) {
  // 获取收款码配�?
  fastify.get('/admin/payment-config', { preHandler: verifyAdmin }, async (_req, reply) => {
    const config = await prisma.paymentConfig.findUnique({ where: { id: 'singleton' } })
    return reply.send(successResponse(config ?? { wechatUrl: null, alipayUrl: null }))
  })

  // 更新收款码配�?
  fastify.put('/admin/payment-config', { preHandler: verifyAdmin }, async (request, reply) => {
    const parse = updateSchema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    const config = await prisma.paymentConfig.upsert({
      where: { id: 'singleton' },
      update: parse.data,
      create: { id: 'singleton', ...parse.data },
    })
    return reply.send(successResponse(config))
  })
}
