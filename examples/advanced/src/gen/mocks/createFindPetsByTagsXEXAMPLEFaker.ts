import type { FindPetsByTagsXEXAMPLEKey } from '../models/ts/FindPetsByTagsXEXAMPLE'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Header parameters
 */
export function createFindPetsByTagsXEXAMPLEFaker(data?: FindPetsByTagsXEXAMPLEKey): FindPetsByTagsXEXAMPLEKey {
  return data ?? faker.helpers.arrayElement<FindPetsByTagsXEXAMPLEKey>(['ONE', 'TWO', 'THREE'])
}
