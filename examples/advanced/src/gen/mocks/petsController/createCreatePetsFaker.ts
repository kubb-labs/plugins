import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsQueryBoolParam,
  CreatePetsResponse,
  CreatePetsStatus201,
  CreatePetsStatusDefault,
} from '../../models/ts/petsController/CreatePets.ts'
import { createCreatePetsXEXAMPLEFaker } from '../createCreatePetsXEXAMPLEFaker.ts'
import { createPetNotFoundFaker } from '../createPetNotFoundFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createCreatePetsQueryBoolParamFaker(data?: CreatePetsQueryBoolParam): CreatePetsQueryBoolParam {
  return data ?? faker.helpers.arrayElement<CreatePetsQueryBoolParam>([true])
}

export function createCreatePetsPathUuidFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createCreatePetsQueryOffsetFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function createCreatePetsHeaderXEXAMPLEFaker(data?: Partial<CreatePetsHeaderXEXAMPLE>): CreatePetsHeaderXEXAMPLE {
  return createCreatePetsXEXAMPLEFaker(data) as CreatePetsHeaderXEXAMPLE
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
  return createPetNotFoundFaker(data) as CreatePetsStatusDefault
}

export function createCreatePetsDataFaker<TData extends Partial<CreatePetsData> = object>(data?: TData) {
  const defaultFakeData = {
    name: faker.string.alpha(),
    tag: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createCreatePetsResponseFaker(_data?: CreatePetsResponse): CreatePetsResponse {
  return faker.helpers.arrayElement<any>([createCreatePetsStatus201Faker(), createCreatePetsStatusDefaultFaker()])
}
