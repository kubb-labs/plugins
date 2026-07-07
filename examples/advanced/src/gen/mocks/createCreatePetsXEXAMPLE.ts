import type { CreatePetsXEXAMPLEKey } from '../models/ts/CreatePetsXEXAMPLE.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Header parameters
 */
export function createCreatePetsXEXAMPLE(data?: CreatePetsXEXAMPLEKey): CreatePetsXEXAMPLEKey {
  return data ?? faker.helpers.arrayElement<CreatePetsXEXAMPLEKey>(['ONE', 'TWO', 'THREE'])
}
