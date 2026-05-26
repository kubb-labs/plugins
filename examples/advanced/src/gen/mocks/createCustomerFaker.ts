import type { Customer } from '../models/ts/Customer.ts'
import { createAddressFaker } from './createAddressFaker.ts'
import { createOrderParamsFaker } from './createOrderParamsFaker.ts'
import { faker } from '@faker-js/faker'

export function createCustomerFaker<TData extends Partial<Customer> = object>(data?: TData) {
  const defaultFakeData = {
    id: faker.number.int(),
    username: faker.string.alpha(),
    params: createOrderParamsFaker(),
    address: faker.helpers.multiple(() => createAddressFaker()),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
