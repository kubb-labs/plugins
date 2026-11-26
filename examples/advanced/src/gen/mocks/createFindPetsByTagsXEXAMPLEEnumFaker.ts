import type { FindPetsByTagsXEXAMPLEEnumKey } from '../models/ts/FindPetsByTagsXEXAMPLEEnum'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Header parameters
 */
export function createFindPetsByTagsXEXAMPLEEnumFaker(data?: FindPetsByTagsXEXAMPLEEnumKey): FindPetsByTagsXEXAMPLEEnumKey {
  return data ?? faker.helpers.arrayElement(['ONE', 'TWO', 'THREE'] as Array<FindPetsByTagsXEXAMPLEEnumKey>)
}
