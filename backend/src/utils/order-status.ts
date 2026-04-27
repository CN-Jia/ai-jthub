import { OrderStatus } from '@prisma/client'

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:     ['ACCEPTED', 'CLOSED'],
  ACCEPTED:    ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['COMPLETED', 'CLOSED'],
  COMPLETED:   ['CLOSED'],
  CLOSED:      [],
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:     '待确认',
  ACCEPTED:    '已接单',
  IN_PROGRESS: '进行中',
  COMPLETED:   '已完成',
  CLOSED:      '已关闭',
}

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}
