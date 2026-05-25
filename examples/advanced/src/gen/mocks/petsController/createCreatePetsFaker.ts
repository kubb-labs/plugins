import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsQueryBoolParam,
  CreatePetsResponse,
  CreatePetsStatus201,
  CreatePetsStatusDefault,
} from '../../models/ts/petsController/CreatePets.ts'
import { createPetNotFoundFaker } from '../createPetNotFoundFaker.ts'
import { faker } from '@faker-js/faker'

export function createCreatePetsQueryBoolParamFaker(data?: CreatePetsQueryBoolParam): CreatePetsQueryBoolParam {
  return data ?? faker.helpers.arrayElement<CreatePetsQueryBoolParam>([true])
}

export function createCreatePetsPathUuidFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createCreatePetsQueryOffsetFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function createCreatePetsHeaderXEXAMPLEFaker(data?: CreatePetsHeaderXEXAMPLE): CreatePetsHeaderXEXAMPLE {
  return data ?? faker.helpers.arrayElement<CreatePetsHeaderXEXAMPLE>(['ONE', 'TWO', 'THREE'])
}

/**
 * @description Null response
 */
export function createCreatePetsStatus201Faker() {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsStatusDefaultFaker(data?: Partial<CreatePetsStatusDefault>): CreatePetsStatusDefault {
  return createPetNotFoundFaker(data)
}

export function createCreatePetsDataFaker(data?: Partial<CreatePetsData>): Required<CreatePetsData> {
  const defaultFakeData = { name: faker.string.alpha(), tag: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<CreatePetsData>
}

export function createCreatePetsResponseFaker(_data?: CreatePetsResponse): CreatePetsResponse {
  return faker.helpers.arrayElement<any>([createCreatePetsStatus201Faker(), createCreatePetsStatusDefaultFaker()])
}
