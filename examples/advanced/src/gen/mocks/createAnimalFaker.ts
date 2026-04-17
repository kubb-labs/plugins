import { faker } from '@faker-js/faker'
import type { Animal } from '../models/ts/Animal.ts'
import { createCatFaker } from './createCatFaker.ts'
import { createDogFaker } from './createDogFaker.ts'

export function createAnimalFaker(data?: Partial<Animal>): Animal {
  return {
    ...{
      ...faker.helpers.arrayElement<any>([
        { ...createCatFaker(), ...{ type: faker.helpers.arrayElement<NonNullable<Animal>['type']>(['cat']) } },
        { ...createDogFaker(), ...{ type: faker.helpers.arrayElement<NonNullable<Animal>['type']>(['dog']) } },
      ]),
      ...{ type: faker.helpers.arrayElement<NonNullable<Animal>['type']>(['cat', 'dog']) },
    },
    ...(data || {}),
  }
}
