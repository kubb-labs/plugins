import type { Dog } from '../models/ts/Dog.ts'
import { createImageFaker } from './createImageFaker.ts'
import { faker } from '@faker-js/faker'

export function createDogFaker(data?: Partial<Dog>): Required<Dog> {
  const defaultFakeData = { type: faker.string.alpha({ length: 1 }), name: faker.string.alpha(), image: createImageFaker() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<Dog>
}
