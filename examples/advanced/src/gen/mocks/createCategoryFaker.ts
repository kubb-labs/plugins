import type { Category } from '../models/ts/Category.ts'
import { faker } from '@faker-js/faker'

export function createCategoryFaker<TData extends Partial<Category> = object>(data?: TData) {
  const defaultFakeData = { id: faker.number.int(), name: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
