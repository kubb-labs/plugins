import type { Animal } from '../models/ts/Animal'
import { createAnimalTypeEnumFaker } from './createAnimalTypeEnumFaker'
import { createCatFaker } from './createCatFaker'
import { createDogFaker } from './createDogFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createAnimalFaker<TData extends Partial<Animal> = object>(data?: TData) {
  const defaultFakeData = {
    ...faker.helpers.arrayElement([
      {
        ...createCatFaker(),
        ...{
          type: faker.helpers.arrayElement<(NonNullable<Animal> & Record<'type', unknown>)['type']>(['cat']),
        },
      },
      {
        ...createDogFaker(),
        ...{
          type: faker.helpers.arrayElement<(NonNullable<Animal> & Record<'type', unknown>)['type']>(['dog']),
        },
      },
    ]),
    ...{
      type: createAnimalTypeEnumFaker(),
    },
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
