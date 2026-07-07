import type { AnimalTypeEnumKey } from '../models/ts/AnimalTypeEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createAnimalTypeEnum(data?: AnimalTypeEnumKey): AnimalTypeEnumKey {
  return data ?? faker.helpers.arrayElement<AnimalTypeEnumKey>(['cat', 'dog'])
}
