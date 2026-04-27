import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'

const activitySchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  type: z.enum(['PROMO', 'NOTICE']),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function adminActivityRoutes(fastify: FastifyInstance) {
  // 获取全部
  fastify.get('/admin/activities', { preHandler: verifyAdmin }, async (_request, reply) => {
    const list = await prisma.activity.findMany({ orderBy: { startAt: 'desc' } })
    return reply.send(successResponse(list))
  })

  // 创建
  fastify.post('/admin/activities', { preHandler: verifyAdmin }, async (request, reply) => {
    const parse = activitySchema.safeParse(request.body)
    if (!parse.success) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    }
    const data = parse.data
    const activity = await prisma.activity.create({
      data: {
        ...data,
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
      },
    })
    return reply.code(201).send(successResponse(activity))
  })

  // 更新
  fastify.put('/admin/activities/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parse = activitySchema.partial().safeParse(request.body)
    if (!parse.success) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    }
    const data = parse.data
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...data,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt !== undefined ? (data.endAt ? new Date(data.endAt) : null) : undefined,
      },
    })
    return reply.send(successResponse(activity))
  })

  // 删除
  fastify.delete('/admin/activities/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.activity.delete({ where: { id } })
    return reply.send(successResponse({ deleted: true }))
  })
}
