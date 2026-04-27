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
import { adminOrderRoutes } from './routes/admin/orders.js'
import { adminOrderTypeRoutes } from './routes/admin/order-types.js'
import { adminActivityRoutes } from './routes/admin/activities.js'
import { rateLimitQuery } from './middlewares/ratelimit.middleware.js'

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
      : true,
  })

  // 插件注册
  await app.register(corsPlugin)
  await app.register(jwtPlugin)

  // 健康检查
  app.get('/health', async () => ({ ok: true, timestamp: new Date().toISOString() }))

  // 公开创单接口添加限流保护
  app.addHook('preHandler', async (request, reply) => {
    if (request.method === 'POST' && request.url === '/api/orders') {
      await rateLimitQuery(request, reply)
    }
  })

  // 路由注册（统一 /api 前缀）
  app.register(authRoutes, { prefix: '/api' })
  app.register(orderRoutes, { prefix: '/api' })
  app.register(adminOrderRoutes, { prefix: '/api' })
  app.register(adminOrderTypeRoutes, { prefix: '/api' })
  app.register(adminActivityRoutes, { prefix: '/api' })

  // 全局错误处理
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    reply.code(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
    })
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
