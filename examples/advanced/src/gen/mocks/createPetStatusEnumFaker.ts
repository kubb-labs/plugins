import type { PetStatusEnumKey } from '../models/ts/PetStatusEnum.ts'
import { faker } from '@faker-js/faker'

/**
 * @description pet status in the store
 */
export function createPetStatusEnumFaker(data?: PetStatusEnumKey): PetStatusEnumKey {
  return data ?? faker.helpers.arrayElement<PetStatusEnumKey>(['available', 'pending', 'sold'])
}
