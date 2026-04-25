import type { Dog } from '../models/ts/Dog.ts'
import { imageFaker } from './image.ts'
import { faker } from '@faker-js/faker'

export function dogFaker(data?: Partial<Dog>): Required<Dog> {
  const defaultFakeData = { type: faker.string.alpha({ length: 1 }), name: faker.string.alpha(), image: imageFaker() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<Dog>
}
