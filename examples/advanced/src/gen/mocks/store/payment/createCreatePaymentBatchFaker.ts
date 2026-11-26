import type { Payment } from '../../../models/ts/Payment'
import { createPaymentFaker } from '../../createPaymentFaker'

type CreatePaymentBatchBody = [Payment, ...string[]]

/**
 * @description Accepted
 */
export function createCreatePaymentBatchStatus204Faker() {
  return undefined
}

export function createCreatePaymentBatchBodyFaker(data?: Partial<CreatePaymentBatchBody>): CreatePaymentBatchBody {
  return (data && data.length === 1 && !data.includes(undefined) ? data : [createPaymentFaker()]) as CreatePaymentBatchBody
}

export function createCreatePaymentBatchResponseFaker() {
  return undefined
}
