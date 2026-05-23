import type { Animal } from '../models/ts/Animal.ts'
import { createCatFaker } from './createCatFaker.ts'
import { createDogFaker } from './createDogFaker.ts'
import { faker } from '@faker-js/faker'

export function createAnimalFaker(data?: Partial<Animal>): Required<Animal> {
  const defaultFakeData = {
    ...faker.helpers.arrayElement<any>([
      { ...createCatFaker(), ...{ type: faker.helpers.arrayElement<any>(['cat']) } },
      { ...createDogFaker(), ...{ type: faker.helpers.arrayElement<any>(['dog']) } },
    ]),
    ...{ type: faker.helpers.arrayElement<any>(['cat', 'dog']) },
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<Animal>
}
