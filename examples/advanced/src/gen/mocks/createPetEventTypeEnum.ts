import type { PetEventTypeEnumKey } from '../models/ts/PetEventTypeEnum.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description The kind of change that occurred
 */
export function createPetEventTypeEnum(data?: PetEventTypeEnumKey): PetEventTypeEnumKey {
  return data ?? faker.helpers.arrayElement<PetEventTypeEnumKey>(['created', 'updated', 'deleted'])
}
