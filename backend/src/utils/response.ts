// 统一 API 响应格式

export function successResponse<T>(data: T) {
  return { success: true as const, data }
}

export function errorResponse(code: string, message: string, _statusCode?: number) {
  return { success: false as const, error: { code, message } }
}

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_MISMATCH: 'ORDER_MISMATCH',
  DUPLICATE_WARNING: 'DUPLICATE_WARNING',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  LINK_EXPIRED: 'LINK_EXPIRED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const
