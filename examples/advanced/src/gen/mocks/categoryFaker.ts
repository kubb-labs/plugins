import type { Category } from '../models/ts/Category.ts'
import { faker } from '@faker-js/faker'

export function categoryFaker(data?: Partial<Category>): Category {
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...(data || {}),
  }
}
