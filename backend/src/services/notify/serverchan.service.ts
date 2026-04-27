import axios from 'axios'
import { env } from '../../config/env.js'
import { Order } from '@prisma/client'

export async function pushServerChan(title: string, content: string): Promise<void> {
  if (!env.SERVERCHAN_TOKEN) throw new Error('SERVERCHAN_TOKEN 未配置')
  await axios.post(`https://sctapi.ftqq.com/${env.SERVERCHAN_TOKEN}.send`, null, {
    params: { title, desp: content },
  })
}

export async function pushAdminNewOrder(order: Order & { orderType?: { name: string } }): Promise<void> {
  const deadlineStr = new Date(order.deadline).toLocaleDateString('zh-CN')
  const gradeMap: Record<string, string> = { FRESHMAN: '大一', SOPHOMORE: '大二', JUNIOR: '大三' }
  const title = `[JT-Hub] 新需求：${order.courseName}`
  const content = `
**订单号**：${order.orderNo}
**课程**：${order.courseName}
**类型**：${order.orderType?.name ?? order.orderTypeId}
**年级**：${gradeMap[order.grade] ?? order.grade}
**截止**：${deadlineStr}
**联系微信**：${order.contactWechat}
**来源**：${order.source === 'MINIPROGRAM' ? '小程序' : 'PC网页'}
  `.trim()
  await pushServerChan(title, content)
}

export async function pushAdminStatusChange(
  order: Order & { orderType?: { name: string } },
  newStatus: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    ACCEPTED: '已接单',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CLOSED: '已关闭',
  }
  const title = `[JT-Hub] 订单状态变更：${statusLabels[newStatus] ?? newStatus}`
  const content = `
**订单号**：${order.orderNo}
**课程**：${order.courseName}
**联系微信**：${order.contactWechat}
**新状态**：${statusLabels[newStatus] ?? newStatus}
  `.trim()
  await pushServerChan(title, content)
}
