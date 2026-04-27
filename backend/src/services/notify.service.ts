import { Order, OrderType } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { pushAdminNewOrder, pushAdminStatusChange } from './notify/serverchan.service.js'
import { env } from '../config/env.js'

type OrderWithType = Order & { orderType: OrderType }

async function logNotify(
  orderId: string,
  channel: 'SERVERCHAN' | 'WECOM',
  type: 'NEW_ORDER' | 'STATUS_CHANGE',
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED',
  error?: string,
  userId?: string
) {
  await prisma.notification.create({
    data: { orderId, channel, type, status, error: error ?? null, userId: userId ?? null },
  }).catch(() => { /* 日志写入失败不影响主流程 */ })
}

/** 新订单创建时通过 Server酱 通知管理员 */
export async function notifyAdminNewOrder(order: OrderWithType): Promise<void> {
  if (!env.SERVERCHAN_TOKEN) return
  try {
    await pushAdminNewOrder(order)
    await logNotify(order.id, 'SERVERCHAN', 'NEW_ORDER', 'SUCCESS')
  } catch (err) {
    await logNotify(order.id, 'SERVERCHAN', 'NEW_ORDER', 'FAILED', String(err))
  }
}

/** 订单状态变更时通过 Server酱 通知管理员 */
export async function notifyAdminStatusChange(order: OrderWithType, newStatus: string): Promise<void> {
  if (!env.SERVERCHAN_TOKEN) return
  try {
    await pushAdminStatusChange(order, newStatus)
    await logNotify(order.id, 'SERVERCHAN', 'STATUS_CHANGE', 'SUCCESS')
  } catch (err) {
    await logNotify(order.id, 'SERVERCHAN', 'STATUS_CHANGE', 'FAILED', String(err))
  }
}
