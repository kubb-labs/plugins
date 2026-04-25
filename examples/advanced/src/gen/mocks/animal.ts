import type { Animal } from '../models/ts/Animal.ts'
import { catFaker } from './cat.ts'
import { dogFaker } from './dog.ts'
import { faker } from '@faker-js/faker'

export function animalFaker(data?: Partial<Animal>): Required<Animal> {
  return Object.assign(
    {} as Required<Animal>,
    {
      ...faker.helpers.arrayElement<any>([
        { ...catFaker(), ...{ type: faker.helpers.arrayElement<NonNullable<Animal>['type']>(['cat']) } },
        { ...dogFaker(), ...{ type: faker.helpers.arrayElement<NonNullable<Animal>['type']>(['dog']) } },
      ]),
      ...{ type: faker.helpers.arrayElement<NonNullable<Animal>['type']>(['cat', 'dog']) },
    },
    data,
  )
}
