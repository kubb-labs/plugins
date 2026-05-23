import type { Animal } from '../models/ts/Animal.ts'
import { createCatFaker } from './createCatFaker.ts'
import { createDogFaker } from './createDogFaker.ts'
import { faker } from '@faker-js/faker'

export function createAnimalFaker(data?: Partial<Animal>): Required<Animal> {
  const defaultFakeData = {
    ...faker.helpers.arrayElement<any>([
      { ...createCatFaker(), ...{ type: faker.helpers.arrayElement<(NonNullable<Animal> & Record<'type', unknown>)['type']>(['cat']) } },
      { ...createDogFaker(), ...{ type: faker.helpers.arrayElement<(NonNullable<Animal> & Record<'type', unknown>)['type']>(['dog']) } },
    ]),
    ...{ type: faker.helpers.arrayElement<(NonNullable<Animal> & Record<'type', unknown>)['type']>(['cat', 'dog']) },
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<Animal>
}
