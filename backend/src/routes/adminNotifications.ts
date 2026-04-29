import { FastifyInstance } from 'fastify'
import { verifyAdmin } from '../middlewares/auth.middleware.js'
import {
  getAdminNotifications,
  markNotificationRead,
  markAllRead,
} from '../services/adminNotification.service.js'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/response.js'

export async function adminNotificationRoutes(fastify: FastifyInstance) {
  // ???? - must be before /:id route
  fastify.put('/admin/notifications/read-all', { preHandler: verifyAdmin }, async (_req, reply) => {
    const updated = await markAllRead()
    return reply.send(successResponse({ updated }))
  })

  // ??????
  fastify.get('/admin/notifications', { preHandler: verifyAdmin }, async (request, reply) => {
    const q = request.query as Record<string, string>
    const unreadOnly = q.unread === 'true'
    const limit = Math.min(Number(q.limit ?? 20), 50)
    const result = await getAdminNotifications(unreadOnly, limit)
    return reply.send(successResponse(result))
  })

  // ??????
  fastify.put('/admin/notifications/:id/read', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await markNotificationRead(id)
      return reply.send(successResponse({ isRead: true }))
    } catch {
      return reply.code(404).send(errorResponse(ERROR_CODES.NOT_FOUND, '?????'))
    }
  })
}
