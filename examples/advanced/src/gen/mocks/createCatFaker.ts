import type { Cat } from '../models/ts/Cat.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createCatFaker<TData extends Partial<Cat> = object>(data?: TData) {
  const defaultFakeData = { type: faker.string.alpha({ length: 1 }), name: faker.string.alpha(), indoor: faker.datatype.boolean() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
