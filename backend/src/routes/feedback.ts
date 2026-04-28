import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

export async function feedbackRoutes(fastify: FastifyInstance) {

  // 提交反馈
  fastify.post('/feedback', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const schema = z.object({
      type: z.enum(['BUG', 'SUGGESTION', 'OTHER']),
      title: z.string().min(2).max(100),
      description: z.string().min(10, '详细描述至少需要10个字符'),
    })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0]?.message ?? '参数错误'))

    const fb = await prisma.feedback.create({ data: { userId, ...parse.data } })
    return reply.code(201).send(successResponse({ id: fb.id, message: '反馈已提交' }))
  })

  // 我的反馈列表
  fastify.get('/feedback/my', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { page = '1', pageSize = '10' } = request.query as Record<string, string>

    const [list, total] = await Promise.all([
      prisma.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        select: { id: true, type: true, title: true, status: true, adminReply: true, repliedAt: true, createdAt: true },
      }),
      prisma.feedback.count({ where: { userId } }),
    ])
    return reply.send(successResponse({ list, total }))
  })

  // 反馈详情
  fastify.get('/feedback/:id', { preHandler: [verifyJWT] }, async (request, reply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }

    const fb = await prisma.feedback.findFirst({
      where: { id, userId },
      select: { id: true, type: true, title: true, description: true, status: true, adminReply: true, repliedAt: true, createdAt: true },
    })
    if (!fb) return reply.code(404).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '反馈不存在'))
    return reply.send(successResponse(fb))
  })
}
