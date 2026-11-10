import type { CreatePetsXEXAMPLEKey } from '../models/ts/CreatePetsXEXAMPLE'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Header parameters
 */
export function createCreatePetsXEXAMPLEFaker(data?: CreatePetsXEXAMPLEKey): CreatePetsXEXAMPLEKey {
  return data ?? faker.helpers.arrayElement(['ONE', 'TWO', 'THREE'] as Array<CreatePetsXEXAMPLEKey>)
}
