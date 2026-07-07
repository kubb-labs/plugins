import type { AddPetRequestStatusEnumKey } from '../models/ts/AddPetRequestStatusEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description pet status in the store
 */
export function createAddPetRequestStatusEnumFaker(data?: AddPetRequestStatusEnumKey): AddPetRequestStatusEnumKey {
  return data ?? faker.helpers.arrayElement<AddPetRequestStatusEnumKey>(['available', 'pending', 'sold'])
}
