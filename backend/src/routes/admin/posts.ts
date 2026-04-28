import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'

export async function adminPostRoutes(fastify: FastifyInstance) {

  // 全部帖子（含待审核）
  fastify.get('/admin/posts', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { page = '1', pageSize = '20', status, type } = request.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const [list, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          author: { select: { nickname: true, email: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ])
    return reply.send(successResponse({ list, total }))
  })

  // 发布公告（管理员）
  fastify.post('/admin/posts', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const schema = z.object({
      title: z.string().min(2).max(100),
      summary: z.string().max(200).optional(),
      content: z.string().min(1),
      cover: z.string().url().optional(),
    })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '参数错误'))

    const post = await prisma.post.create({
      data: { ...parse.data, type: 'ANNOUNCEMENT', status: 'APPROVED' },
    })
    return reply.code(201).send(successResponse(post))
  })

  // 编辑帖子
  fastify.put('/admin/posts/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      title: z.string().min(2).max(100).optional(),
      summary: z.string().max(200).optional(),
      content: z.string().min(1).optional(),
      cover: z.string().optional(),
    })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '参数错误'))

    const post = await prisma.post.update({ where: { id }, data: parse.data })
    return reply.send(successResponse(post))
  })

  // 审核帖子
  fastify.patch('/admin/posts/:id/status', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: 'APPROVED' | 'REJECTED' }
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '状态值无效'))
    }
    const post = await prisma.post.update({ where: { id }, data: { status } })
    return reply.send(successResponse(post))
  })

  // 删除帖子
  fastify.delete('/admin/posts/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.post.delete({ where: { id } })
    return reply.send(successResponse({ message: '已删除' }))
  })

  // 隐藏/显示评论
  fastify.patch('/admin/comments/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { isHidden } = request.body as { isHidden: boolean }
    const comment = await prisma.comment.update({ where: { id }, data: { isHidden } })
    return reply.send(successResponse(comment))
  })

  // 删除评论
  fastify.delete('/admin/comments/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.comment.delete({ where: { id } })
    return reply.send(successResponse({ message: '已删除' }))
  })
}
