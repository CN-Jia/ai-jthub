import { OrderStatus } from '@prisma/client'

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED:     ['PENDING', 'CANCELLED'],
  PENDING:     ['ACCEPTED', 'IN_PROGRESS', 'CLOSED', 'CANCELLED'],
  ACCEPTED:    ['IN_PROGRESS', 'CLOSED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CLOSED', 'CANCELLED'],
  COMPLETED:   ['CLOSED'],
  CLOSED:      [],
  CANCELLED:   [],
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED:     '已创建',
  PENDING:     '待确认',
  ACCEPTED:    '已接单',
  IN_PROGRESS: '进行中',
  COMPLETED:   '已完成',
  CLOSED:      '已关闭',
  CANCELLED:   '已取消',
}

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}
