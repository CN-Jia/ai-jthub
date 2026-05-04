import { OrderStatus } from '@prisma/client'

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED:     ['PENDING', 'CANCELLED'],
  PENDING:     ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED:   [],
  CANCELLED:   [],
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED:     '已创建',
  PENDING:     '待接单',
  IN_PROGRESS: '进行中',
  COMPLETED:   '已结单',
  CANCELLED:   '已取消',
}

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}
