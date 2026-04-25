import type { Cat } from '../models/ts/Cat.ts'
import { faker } from '@faker-js/faker'

export function catFaker(data?: Partial<Cat>): Required<Cat> {
  return Object.assign({} as Required<Cat>, { type: faker.string.alpha({ length: 1 }), name: faker.string.alpha(), indoor: faker.datatype.boolean() }, data)
}
