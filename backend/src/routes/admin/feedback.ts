import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { sendFeedbackReply } from '../../services/email.service.js'

export async function adminFeedbackRoutes(fastify: FastifyInstance) {

  // 全部反馈列表
  fastify.get('/admin/feedback', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { page = '1', pageSize = '20', status, type } = request.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const [list, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: { user: { select: { nickname: true, email: true, username: true } } },
      }),
      prisma.feedback.count({ where }),
    ])
    return reply.send(successResponse({ list, total }))
  })

  // 回复反馈
  fastify.post('/admin/feedback/:id/reply', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({ reply: z.string().min(1) })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '回复内容不能为空'))

    const fb = await prisma.feedback.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    })
    if (!fb) return reply.code(404).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '反馈不存在'))

    const updated = await prisma.feedback.update({
      where: { id },
      data: { adminReply: parse.data.reply, repliedAt: new Date(), status: 'REPLIED' },
    })

    // 发送邮件通知
    sendFeedbackReply(fb.user.email, fb.title, parse.data.reply).catch(() => {})

    return reply.send(successResponse(updated))
  })

  // 更新状态
  fastify.patch('/admin/feedback/:id/status', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: 'PENDING' | 'REPLIED' | 'RESOLVED' }
    if (!['PENDING', 'REPLIED', 'RESOLVED'].includes(status)) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '状态值无效'))
    }
    const updated = await prisma.feedback.update({ where: { id }, data: { status } })
    return reply.send(successResponse(updated))
  })
}
