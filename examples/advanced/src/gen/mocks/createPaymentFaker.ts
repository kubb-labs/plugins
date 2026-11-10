import type { Payment } from '../models/ts/Payment'
import { createPaymentLabelFaker } from './createPaymentLabelFaker'
import { createPaymentMetadataFaker } from './createPaymentMetadataFaker'
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
    labels: [...faker.helpers.multiple(() => createPaymentLabelFaker(), { count: 1 }), ...faker.helpers.multiple(() => faker.string.alpha())],
    metadata: JSON.stringify(createPaymentMetadataFaker()),
    receipt: btoa(faker.string.alpha()),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
