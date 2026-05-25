import type { Address } from '../models/ts/Address.ts'
import { faker } from '@faker-js/faker'

export function createAddressFaker<TData extends Partial<Address> = object>(data?: TData) {
  const defaultFakeData = { street: faker.string.alpha(), city: faker.string.alpha(), state: faker.string.alpha(), zip: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
