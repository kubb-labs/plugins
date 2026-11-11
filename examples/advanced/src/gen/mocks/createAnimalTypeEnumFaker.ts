import type { AnimalTypeEnumKey } from '../models/ts/AnimalTypeEnum'
import { fakerEN as faker } from '@faker-js/faker'

export function createAnimalTypeEnumFaker(data?: AnimalTypeEnumKey): AnimalTypeEnumKey {
  return data ?? faker.helpers.arrayElement(['cat', 'dog'] as Array<AnimalTypeEnumKey>)
}
