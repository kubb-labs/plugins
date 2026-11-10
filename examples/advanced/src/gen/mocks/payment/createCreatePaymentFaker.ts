import type { Payment } from '../../models/ts/Payment'
import { createPaymentFaker } from '../createPaymentFaker'

/**
 * @description Created
 */
export function createCreatePaymentStatus201Faker(data?: Partial<Payment>): Payment {
  return createPaymentFaker(data) as Payment
}

export function createCreatePaymentBodyFaker(data?: Partial<Payment>): Payment {
  return createPaymentFaker(data) as Payment
}

export function createCreatePaymentResponseFaker(data?: Partial<Payment>): Payment {
  return createCreatePaymentStatus201Faker(data) as Payment
}
