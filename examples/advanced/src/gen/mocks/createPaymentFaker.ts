import type { Payment } from '../models/ts/Payment'
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
    labels: [
      ...faker.helpers.multiple(() => faker.helpers.arrayElement<NonNullable<NonNullable<Payment>['labels']>[number]>(['priority']), { count: 1 }),
      ...faker.helpers.multiple(() => faker.string.alpha()),
    ],
    metadata: JSON.stringify({
      source: faker.string.alpha(),
    }),
    receipt: btoa(faker.string.alpha()),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
