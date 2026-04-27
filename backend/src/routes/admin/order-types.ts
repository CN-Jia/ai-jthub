import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'

const typeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  price: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export async function adminOrderTypeRoutes(fastify: FastifyInstance) {
  // 获取全部（含非激活）
  fastify.get('/admin/order-types', { preHandler: verifyAdmin }, async (_request, reply) => {
    const types = await prisma.orderType.findMany({ orderBy: { sortOrder: 'asc' } })
    return reply.send(successResponse(types))
  })

  // 创建
  fastify.post('/admin/order-types', { preHandler: verifyAdmin }, async (request, reply) => {
    const parse = typeSchema.safeParse(request.body)
    if (!parse.success) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    }
    const type = await prisma.orderType.create({ data: parse.data })
    return reply.code(201).send(successResponse(type))
  })

  // 更新
  fastify.put('/admin/order-types/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parse = typeSchema.partial().safeParse(request.body)
    if (!parse.success) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    }
    const type = await prisma.orderType.update({ where: { id }, data: parse.data })
    return reply.send(successResponse(type))
  })

  // 删除
  fastify.delete('/admin/order-types/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const count = await prisma.order.count({ where: { orderTypeId: id } })
    if (count > 0) {
      return reply.code(409).send(errorResponse('CONFLICT', `该类型已有 ${count} 个订单，不能删除，请改为下架`))
    }
    await prisma.orderType.delete({ where: { id } })
    return reply.send(successResponse({ deleted: true }))
  })
}
