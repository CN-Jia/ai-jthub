import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'

export async function adminUserRoutes(fastify: FastifyInstance) {

  fastify.get('/admin/users', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { page = '1', pageSize = '20', keyword } = request.query as Record<string, string>
    const where: any = keyword
      ? { OR: [{ nickname: { contains: keyword, mode: 'insensitive' as const } }, { username: { contains: keyword, mode: 'insensitive' as const } }, { email: { contains: keyword, mode: 'insensitive' as const } }] }
      : {}

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        select: { id: true, username: true, nickname: true, email: true, phone: true, grade: true, isActive: true, emailVerified: true, createdAt: true, _count: { select: { orders: true } } },
      }),
      prisma.user.count({ where }),
    ])
    return reply.send(successResponse({ list, total }))
  })

  const updateActiveSchema = z.object({ isActive: z.boolean() })

  fastify.patch('/admin/users/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parse = updateActiveSchema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '参数错误'))
    const user = await prisma.user.update({ where: { id }, data: { isActive: parse.data.isActive } })
    return reply.send(successResponse({ id: user.id, isActive: user.isActive }))
  })
}
