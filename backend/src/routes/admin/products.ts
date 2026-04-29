import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().optional(),
  price: z.number().positive(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
})

export async function adminProductRoutes(fastify: FastifyInstance) {
  // ???????????
  fastify.get('/admin/products', { preHandler: verifyAdmin }, async (request, reply) => {
    const q = request.query as Record<string, string>
    const page = Number(q.page ?? 1)
    const pageSize = Number(q.pageSize ?? 20)
    const [list, total] = await Promise.all([
      prisma.product.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count(),
    ])
    return reply.send(successResponse({ list, total }))
  })

  // ????
  fastify.post('/admin/products', { preHandler: verifyAdmin }, async (request, reply) => {
    const parse = productSchema.safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    const data = parse.data
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        imageUrl: data.imageUrl || null,
        price: data.price,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    })
    return reply.code(201).send(successResponse(product))
  })

  // ????
  fastify.put('/admin/products/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parse = productSchema.partial().safeParse(request.body)
    if (!parse.success) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, parse.error.errors[0].message))
    const data = parse.data
    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        },
      })
      return reply.send(successResponse(product))
    } catch {
      return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '?????'))
    }
  })

  // ??????????????
  fastify.delete('/admin/products/:id', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const orderCount = await prisma.productOrder.count({ where: { productId: id } })
    if (orderCount > 0) {
      return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, `Has ${orderCount} related orders, please deactivate instead`))
    }
    try {
      await prisma.product.delete({ where: { id } })
      return reply.send(successResponse({ deleted: true }))
    } catch {
      return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '?????'))
    }
  })

  // ?????
  fastify.patch('/admin/products/:id/toggle', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '?????'))
    const product = await prisma.product.update({ where: { id }, data: { isActive: !existing.isActive } })
    return reply.send(successResponse({ isActive: product.isActive }))
  })
}
