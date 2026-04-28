import 'dotenv/config'
import Fastify from 'fastify'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'

// 插件
import jwtPlugin from './plugins/jwt.js'
import corsPlugin from './plugins/cors.js'

// 路由
import { authRoutes } from './routes/auth.js'
import { orderRoutes } from './routes/orders.js'
import { postRoutes } from './routes/posts.js'
import { feedbackRoutes } from './routes/feedback.js'
import { carouselRoutes } from './routes/carousel.js'
import { adminOrderRoutes } from './routes/admin/orders.js'
import { adminOrderTypeRoutes } from './routes/admin/order-types.js'
import { adminActivityRoutes } from './routes/admin/activities.js'
import { adminPostRoutes } from './routes/admin/posts.js'
import { adminFeedbackRoutes } from './routes/admin/feedback.js'
import { adminCarouselRoutes } from './routes/admin/carousel.js'
import { adminUserRoutes } from './routes/admin/users.js'
import { pointsRoutes } from './routes/points.js'
import { adminPointsRoutes } from './routes/admin/points.js'
import { adminSystemRoutes } from './routes/admin/system.js'
import { rateLimitQuery } from './middlewares/ratelimit.middleware.js'

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : true,
  })

  await app.register(corsPlugin)
  await app.register(jwtPlugin)

  app.get('/health', async () => ({ ok: true, timestamp: new Date().toISOString() }))

  // 限流：提交订单
  app.addHook('preHandler', async (request, reply) => {
    if (request.method === 'POST' && request.url === '/api/orders') {
      await rateLimitQuery(request, reply)
    }
  })

  // 路由注册
  app.register(authRoutes, { prefix: '/api' })
  app.register(orderRoutes, { prefix: '/api' })
  app.register(postRoutes, { prefix: '/api' })
  app.register(feedbackRoutes, { prefix: '/api' })
  app.register(carouselRoutes, { prefix: '/api' })
  app.register(adminOrderRoutes, { prefix: '/api' })
  app.register(adminOrderTypeRoutes, { prefix: '/api' })
  app.register(adminActivityRoutes, { prefix: '/api' })
  app.register(adminPostRoutes, { prefix: '/api' })
  app.register(adminFeedbackRoutes, { prefix: '/api' })
  app.register(adminCarouselRoutes, { prefix: '/api' })
  app.register(adminUserRoutes, { prefix: '/api' })
  app.register(pointsRoutes, { prefix: '/api' })
  app.register(adminPointsRoutes, { prefix: '/api' })
  app.register(adminSystemRoutes, { prefix: '/api' })

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    reply.code(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' } })
  })

  return app
}

if (process.env.NODE_ENV !== 'test') {
  buildApp().then(app => {
    app.listen({ port: env.PORT, host: '0.0.0.0' }, (err) => {
      if (err) { app.log.error(err); process.exit(1) }
      logger.info(`🚀 JT-Hub API running at http://localhost:${env.PORT}`)
    })
  })
}
