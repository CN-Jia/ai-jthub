import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'

export async function adminCarouselRoutes(fastify: FastifyInstance) {

  fastify.get('/admin/carousel', { preHandler: [verifyAdmin] }, async (_request, reply) => {
    const list = await prisma.carousel.findMany({ orderBy: { sortOrder: 'asc' } })
    return reply.send(successResponse(list))
  })

  fastify.post('/admin/carousel', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const schema = z.object({
      imageUrl: z.string().url(),
      courseName: z.string().min(1),
      orderType: z.string().min(1),
      completedAt: z.string().datetime(),
      review: z.string().optional(),
      orderNoMask: z.string().optional(),
      sortOrder: z.number().default(0),
      isActive: z.boolean().default(true),
    })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '参数错误'))

    const item = await prisma.carousel.create({
      data: { ...parse.data, completedAt: new Date(parse.data.completedAt) },
    })
    return reply.code(201).send(successResponse(item))
  })

  fastify.put('/admin/carousel/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      imageUrl: z.string().url().optional(),
      courseName: z.string().optional(),
      orderType: z.string().optional(),
      completedAt: z.string().datetime().optional(),
      review: z.string().optional(),
      orderNoMask: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.boolean().optional(),
    })
    const parse = schema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '参数错误'))

    const data: any = { ...parse.data }
    if (data.completedAt) data.completedAt = new Date(data.completedAt)

    const item = await prisma.carousel.update({ where: { id }, data })
    return reply.send(successResponse(item))
  })

  fastify.delete('/admin/carousel/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.carousel.delete({ where: { id } })
    return reply.send(successResponse({ message: '已删除' }))
  })
}
