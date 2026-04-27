import { Resend } from 'resend'
import { env } from '../../config/env.js'
import { Order } from '@prisma/client'

const resend = new Resend(env.RESEND_API_KEY)

export async function sendAdminNewOrderEmail(order: Order): Promise<void> {
  const deadlineStr = new Date(order.deadline).toLocaleDateString('zh-CN')
  await resend.emails.send({
    from: env.MAIL_FROM,
    to: env.ADMIN_EMAIL,
    subject: `[JT-Hub] 新需求来了：${order.title}`,
    html: `
      <h2>有新需求提交！</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>订单号</b></td><td style="padding:8px;border:1px solid #ddd">${order.orderNo}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>标题</b></td><td style="padding:8px;border:1px solid #ddd">${order.title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>类型</b></td><td style="padding:8px;border:1px solid #ddd">${order.type}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>截止日期</b></td><td style="padding:8px;border:1px solid #ddd">${deadlineStr}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>联系邮箱</b></td><td style="padding:8px;border:1px solid #ddd">${order.contactEmail}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>预估价格</b></td><td style="padding:8px;border:1px solid #ddd">${order.estimatedPrice ?? '未填写'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>来源</b></td><td style="padding:8px;border:1px solid #ddd">${order.source}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5"><b>需求描述</b></td><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">${order.description}</td></tr>
      </table>
      <p><a href="${env.APP_BASE_URL}/admin/orders/${order.id}" style="background:#1677ff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">前往管理后台处理</a></p>
    `,
  })
}

export async function sendUserDeliveryEmail(
  order: Order,
  downloadUrl: string,
  expiresAt: Date
): Promise<void> {
  const expiresStr = expiresAt.toLocaleDateString('zh-CN')
  await resend.emails.send({
    from: env.MAIL_FROM,
    to: order.contactEmail,
    subject: `您的项目已完成交付：${order.title}`,
    html: `
      <h2>您的项目已完成！</h2>
      <p>您好，您提交的项目（${order.orderNo}）已完成交付，请及时下载。</p>
      <p><a href="${downloadUrl}" style="background:#52c41a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">点击下载文件</a></p>
      <p style="color:#999;font-size:12px">下载链接有效期至：${expiresStr}（7天）。如链接过期，请联系技术支持。</p>
      <p style="color:#999;font-size:12px">技术支持微信：${env.ADMIN_WECHAT_ID}</p>
    `,
  })
}
