import axios from 'axios'
import { env } from '../../config/env.js'
import { Order } from '@prisma/client'

export async function pushWecom(order: Order): Promise<void> {
  const deadlineStr = new Date(order.deadline).toLocaleDateString('zh-CN')
  await axios.post(env.WECOM_WEBHOOK_URL, {
    msgtype: 'markdown',
    markdown: {
      content: [
        `## 📋 JT-Hub 新需求`,
        `**订单号**：<font color="info">${order.orderNo}</font>`,
        `**标题**：${order.title}`,
        `**类型**：${order.type}`,
        `**截止**：${deadlineStr}`,
        `**邮箱**：${order.contactEmail}`,
        `**预估价**：${order.estimatedPrice ?? '未填写'}`,
        `**来源**：${order.source === 'MINIPROGRAM' ? '小程序' : 'Web'}`,
        `[👉 前往处理](${env.APP_BASE_URL}/admin/orders/${order.id})`,
      ].join('\n'),
    },
  })
}
