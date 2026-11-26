import type { CreatePetsXEXAMPLEEnumKey } from '../models/ts/CreatePetsXEXAMPLEEnum'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description Header parameters
 */
export function createCreatePetsXEXAMPLEEnumFaker(data?: CreatePetsXEXAMPLEEnumKey): CreatePetsXEXAMPLEEnumKey {
  return data ?? faker.helpers.arrayElement(['ONE', 'TWO', 'THREE'] as Array<CreatePetsXEXAMPLEEnumKey>)
}
