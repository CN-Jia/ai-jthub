import { FastifyInstance } from 'fastify'
import { verifyAdmin } from '../../middlewares/auth.middleware.js'
import { updateOrderStatus } from '../../services/order.service.js'
import { uploadFile } from '../../services/oss.service.js'
import { createShortLink } from '../../services/shortlink.service.js'
import { notifyUserDelivery } from '../../services/notify.service.js'
import { prisma } from '../../lib/prisma.js'
import { successResponse, errorResponse, ERROR_CODES } from '../../utils/response.js'
import { env } from '../../config/env.js'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

export async function adminFileRoutes(fastify: FastifyInstance) {
  // 上传成品文件
  fastify.post('/admin/orders/:id/file', { preHandler: verifyAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return reply.code(404).send(errorResponse(ERROR_CODES.ORDER_NOT_FOUND, '订单不存在'))

    const data = await request.file()
    if (!data) return reply.code(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, '请上传文件'))

    // 上传 OSS
    const { ossKey } = await uploadFile(data.file as unknown as Readable, data.filename, id)

    // 获取文件大小（从 OSS 读取 head 信息，或从 multipart 中计算）
    const chunks: Buffer[] = []
    // 注意：ali-oss putStream 已消费 stream，此处 fileSize 从 data.fields 或后续 head 获取
    // 简化处理：使用 0 占位，实际生产中应从 OSS head 获取
    const fileSize = 0

    // 生成短链接
    const { shortHash, shortUrl, expiresAt } = await createShortLink({
      orderId: id,
      ossKey,
      filename: data.filename,
      fileSize,
      mimeType: data.mimetype,
    })

    // 更新订单状态为 COMPLETED
    const updatedOrder = await updateOrderStatus(id, 'COMPLETED', '文件已上传，自动标记完成')

    // 异步通知用户
    notifyUserDelivery(updatedOrder, shortUrl, expiresAt).catch(() => {})

    return reply.send(successResponse({
      fileId: shortHash,
      filename: data.filename,
      shortUrl,
      expiresAt,
    }))
  })
}
