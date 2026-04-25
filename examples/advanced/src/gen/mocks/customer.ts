import type { Customer } from '../models/ts/Customer.ts'
import { addressFaker } from './address.ts'
import { faker } from '@faker-js/faker'

export function customerFaker(data?: Partial<Customer>): Required<Customer> {
  return Object.assign(
    {} as Required<Customer>,
    {
      id: faker.number.int(),
      username: faker.string.alpha(),
      params: { status: faker.helpers.arrayElement<any>(['working', 'idle']), type: faker.string.alpha() },
      address: faker.helpers.multiple(() => addressFaker()),
    },
    data,
  )
}
