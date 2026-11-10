import type { PaymentLabelKey } from '../models/ts/PaymentLabel'
import { fakerEN as faker } from '@faker-js/faker'

export function createPaymentLabelFaker(data?: PaymentLabelKey): PaymentLabelKey {
  return data ?? faker.helpers.arrayElement<PaymentLabelKey>(['priority'])
}
