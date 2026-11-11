import type { Payment } from '../models/ts/Payment'
import { createPaymentErrorFaker } from './createPaymentErrorFaker'
import { createPaymentMethodEnumFaker } from './createPaymentMethodEnumFaker'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description A payment for a store order
 */
export function createPaymentFaker<TData extends Partial<Payment> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int({ min: 1 }),
    method: createPaymentMethodEnumFaker(),
    creditCard: faker.string.alpha(),
    billingAddress: faker.string.alpha(),
    labels: faker.helpers.multiple(() => faker.string.alpha()),
    lastError: JSON.stringify(createPaymentErrorFaker()),
    signature: faker.string.alphanumeric(8),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
