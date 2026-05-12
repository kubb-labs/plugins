import type { Category } from '../models/ts/Category.ts'
import { faker } from '@faker-js/faker'

export function createCategoryFaker(data?: Partial<Category>): Required<Category> {
  const defaultFakeData = { id: faker.number.int(), name: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<Category>
}
