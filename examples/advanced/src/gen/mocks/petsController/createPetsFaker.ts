import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsQueryBoolParam,
  CreatePetsResponse,
  CreatePetsStatusDefault,
} from '../../models/ts/petsController/CreatePets.ts'
import { petNotFoundFaker } from '../petNotFoundFaker.ts'
import { faker } from '@faker-js/faker'

export function createPetsQueryBoolParamFaker(data?: CreatePetsQueryBoolParam): CreatePetsQueryBoolParam {
  return data ?? faker.helpers.arrayElement<CreatePetsQueryBoolParam>([true])
}

export function createPetsPathUuidFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createPetsQueryOffsetFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function createPetsHeaderXEXAMPLEFaker(data?: CreatePetsHeaderXEXAMPLE): CreatePetsHeaderXEXAMPLE {
  return data ?? faker.helpers.arrayElement<CreatePetsHeaderXEXAMPLE>(['ONE', 'TWO', 'THREE'])
}

/**
 * @description Null response
 */
export function createPetsStatus201Faker() {
  return undefined
}

/**
 * @description unexpected error
 */
export function createPetsStatusDefaultFaker(data?: Partial<CreatePetsStatusDefault>): CreatePetsStatusDefault {
  return petNotFoundFaker(data)
}

export function createPetsDataFaker(data?: Partial<CreatePetsData>): CreatePetsData {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createPetsResponseFaker(_data?: CreatePetsResponse): CreatePetsResponse {
  return faker.helpers.arrayElement<any>([createPetsStatus201Faker(), createPetsStatusDefaultFaker()])
}
