import type { Customer } from '../models/ts/Customer.ts'
import { createAddressFaker } from './createAddressFaker.ts'
import { faker } from '@faker-js/faker'

export function createCustomerFaker(data?: Partial<Customer>): Required<Customer> {
  const defaultFakeData = {
    id: faker.number.int(),
    username: faker.string.alpha(),
    params: { status: faker.helpers.arrayElement<any>(['working', 'idle']), type: faker.string.alpha() },
    address: faker.helpers.multiple(() => createAddressFaker()),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<Customer>
}
