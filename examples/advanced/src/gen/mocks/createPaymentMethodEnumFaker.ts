import type { PaymentMethodEnumKey } from '../models/ts/PaymentMethodEnum'
import { fakerEN as faker } from '@faker-js/faker'

export function createPaymentMethodEnumFaker(data?: PaymentMethodEnumKey): PaymentMethodEnumKey {
  return data ?? faker.helpers.arrayElement(['card', 'cash'] as Array<PaymentMethodEnumKey>)
}
