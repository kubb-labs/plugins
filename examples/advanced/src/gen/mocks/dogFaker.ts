import { faker } from '@faker-js/faker'
import type { Dog } from '../models/ts/Dog.ts'
import { imageFaker } from './imageFaker.ts'

export function dogFaker(data?: Partial<Dog>): Dog {
  return {
    ...{ type: faker.string.alpha({ length: 1 }), name: faker.string.alpha(), image: imageFaker() },
    ...(data || {}),
  }
}
