import type { Dog } from '../models/ts/Dog.ts'
import { createImage } from './createImage.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createDog<TData extends Partial<Dog> = object>(data?: TData) {
  const defaultFakeData = {
    type: faker.string.alpha({ length: 1 }),
    name: faker.string.alpha(),
    image: createImage(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
