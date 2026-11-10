import type { PetStatusEnumKey } from '../models/ts/PetStatusEnum'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description pet status in the store
 */
export function createPetStatusEnumFaker(data?: PetStatusEnumKey): PetStatusEnumKey {
  return data ?? faker.helpers.arrayElement(['available', 'pending', 'sold'] as Array<PetStatusEnumKey>)
}
