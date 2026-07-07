import type { Animal } from '../models/ts/Animal.ts'
import { createAnimalTypeEnum } from './createAnimalTypeEnum.ts'
import { createCat } from './createCat.ts'
import { createDog } from './createDog.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createAnimal<TData extends Partial<Animal> = object>(data?: TData) {
  const defaultFakeData = {
    ...faker.helpers.arrayElement([
      {
        ...createCat(),
        ...{
          type: faker.helpers.arrayElement<(NonNullable<Animal> & Record<'type', unknown>)['type']>(['cat']),
        },
      },
      {
        ...createDog(),
        ...{
          type: faker.helpers.arrayElement<(NonNullable<Animal> & Record<'type', unknown>)['type']>(['dog']),
        },
      },
    ]),
    ...{
      type: createAnimalTypeEnum(),
    },
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}
