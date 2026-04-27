import { describe, it, expect } from 'vitest'
import { isValidTransition, VALID_TRANSITIONS } from '../../src/utils/order-status.js'
import { OrderStatus } from '@prisma/client'

describe('order-status state machine', () => {
  it('PENDING can transition to ACCEPTED or CLOSED', () => {
    expect(isValidTransition('PENDING', 'ACCEPTED')).toBe(true)
    expect(isValidTransition('PENDING', 'CLOSED')).toBe(true)
  })

  it('PENDING cannot skip to IN_PROGRESS or COMPLETED', () => {
    expect(isValidTransition('PENDING', 'IN_PROGRESS')).toBe(false)
    expect(isValidTransition('PENDING', 'COMPLETED')).toBe(false)
  })

  it('ACCEPTED can transition to IN_PROGRESS or CLOSED', () => {
    expect(isValidTransition('ACCEPTED', 'IN_PROGRESS')).toBe(true)
    expect(isValidTransition('ACCEPTED', 'CLOSED')).toBe(true)
  })

  it('IN_PROGRESS can transition to COMPLETED or CLOSED', () => {
    expect(isValidTransition('IN_PROGRESS', 'COMPLETED')).toBe(true)
    expect(isValidTransition('IN_PROGRESS', 'CLOSED')).toBe(true)
  })

  it('COMPLETED can only transition to CLOSED', () => {
    expect(isValidTransition('COMPLETED', 'CLOSED')).toBe(true)
    expect(isValidTransition('COMPLETED', 'PENDING')).toBe(false)
    expect(isValidTransition('COMPLETED', 'IN_PROGRESS')).toBe(false)
  })

  it('CLOSED is terminal state with no valid transitions', () => {
    const statuses = Object.keys(VALID_TRANSITIONS) as OrderStatus[]
    statuses.forEach(status => {
      expect(isValidTransition('CLOSED', status)).toBe(false)
    })
  })
})
