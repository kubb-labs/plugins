import type { Payment } from '../../../models/ts/Payment'
import { createPaymentFaker } from '../../createPaymentFaker'

/**
 * @description Accepted
 */
export function createCreatePaymentBatchStatus204Faker() {
  return undefined
}

export function createCreatePaymentBatchBodyFaker(data?: Partial<[Payment, ...string[]]>): [Payment, ...string[]] {
  return (data && data.length === 1 && !data.includes(undefined) ? data : [createPaymentFaker()]) as [Payment, ...string[]]
}

export function createCreatePaymentBatchResponseFaker() {
  return undefined
}
