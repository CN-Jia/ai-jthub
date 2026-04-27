import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { mpLogin } from '../services/wechat.service.js'
import { adminLogin } from '../services/auth.service.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'
import { env } from '../config/env.js'

export async function authRoutes(fastify: FastifyInstance) {
  // 小程序静默登录
  fastify.post('/auth/mp-login', {
    schema: { body: { type: 'object', required: ['code'], properties: { code: { type: 'string' } } } },
  }, async (request, reply) => {
    const { code } = request.body as { code: string }
    try {
      const { userId, openid } = await mpLogin(code)
      const token = fastify.jwt.sign({ userId, role: 'user', openid }, { expiresIn: env.JWT_EXPIRES_IN })
      return reply.send(successResponse({ token, userId }))
    } catch (err) {
      return reply.code(401).send(errorResponse(ERROR_CODES.UNAUTHORIZED, '微信登录失败，请重试'))
    }
  })

  // 管理员登录
  fastify.post('/auth/admin-login', {
    schema: { body: { type: 'object', required: ['username', 'password'] } },
  }, async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string }
    const ok = await adminLogin(username, password)
    if (!ok) return reply.code(401).send(errorResponse(ERROR_CODES.UNAUTHORIZED, '用户名或密码错误'))
    const token = fastify.jwt.sign({ role: 'admin' }, { expiresIn: env.JWT_EXPIRES_IN })
    return reply.send(successResponse({ token }))
  })
}
