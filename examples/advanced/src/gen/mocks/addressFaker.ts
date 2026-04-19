import type { Address } from '../models/ts/Address.ts'
import { faker } from '@faker-js/faker'

export function addressFaker(data?: Partial<Address>): Address {
  return {
    ...{ street: faker.string.alpha(), city: faker.string.alpha(), state: faker.string.alpha(), zip: faker.string.alpha() },
    ...(data || {}),
  }
}
