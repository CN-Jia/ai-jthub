import { FastifyInstance } from 'fastify'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { prisma } from '../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'

export async function productRoutes(fastify: FastifyInstance) {
  // 商品列表（需登录）
  fastify.get('/products', { preHandler: verifyJWT }, async (_req, reply) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, description: true, imageUrl: true, price: true },
    })
    return reply.send(successResponse(products))
  })

  // 商品详情（需登录）
  fastify.get('/products/:id', { preHandler: verifyJWT }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      select: { id: true, name: true, description: true, imageUrl: true, price: true },
    })
    if (!product) {
      return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '商品不存在'))
    }
    return reply.send(successResponse(product))
  })

  // 获取收款码配置（需登录）
  fastify.get('/payment-config', { preHandler: verifyJWT }, async (_req, reply) => {
    const config = await prisma.paymentConfig.findUnique({ where: { id: 'singleton' } })
    return reply.send(successResponse({ wechatUrl: config?.wechatUrl ?? null, alipayUrl: config?.alipayUrl ?? null }))
  })
}
