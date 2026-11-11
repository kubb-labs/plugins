import type { Animal } from '../models/ts/Animal'
import { createAnimalTypeEnumFaker } from './createAnimalTypeEnumFaker'
import { createCatFaker } from './createCatFaker'
import { createDogFaker } from './createDogFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createAnimalFaker<TData extends Partial<Animal> = object>(data?: TData) {
  const defaultFakeData = {
    ...{
      type: createAnimalTypeEnumFaker(),
    },
    ...faker.helpers.arrayElement([
      {
        ...createCatFaker(),
        ...{
          type: faker.helpers.arrayElement(['cat'] as Array<(NonNullable<Extract<NonNullable<Animal>, { type: 'cat' }>> & Record<'type', unknown>)['type']>),
        },
      },
      {
        ...createDogFaker(),
        ...{
          type: faker.helpers.arrayElement(['dog'] as Array<(NonNullable<Extract<NonNullable<Animal>, { type: 'dog' }>> & Record<'type', unknown>)['type']>),
        },
      },
    ]),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as unknown as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}
