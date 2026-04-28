import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { successResponse } from '../utils/response.js'

export async function carouselRoutes(fastify: FastifyInstance) {
  fastify.get('/carousel', async (_request, reply) => {
    const list = await prisma.carousel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, imageUrl: true, courseName: true, orderType: true, completedAt: true, review: true, orderNoMask: true },
    })
    return reply.send(successResponse(list))
  })
}
