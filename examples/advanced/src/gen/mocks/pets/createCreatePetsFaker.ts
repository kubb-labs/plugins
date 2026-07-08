import type {
  CreatePetsBody,
  CreatePetsHeaders,
  CreatePetsPath,
  CreatePetsQuery,
  CreatePetsResponse,
  CreatePetsStatus201,
  CreatePetsStatusDefault,
} from '../../models/ts/pets/CreatePets.ts'
import { createCreatePetsBoolParamFaker } from '../createCreatePetsBoolParamFaker.ts'
import { createCreatePetsXEXAMPLEFaker } from '../createCreatePetsXEXAMPLEFaker.ts'
import { createPetNotFoundFaker } from '../createPetNotFoundFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createCreatePetsPathFaker<TData extends Partial<CreatePetsPath> = object>(data?: TData) {
  const defaultFakeData = {
    uuid: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createCreatePetsQueryFaker<TData extends Partial<CreatePetsQuery> = object>(data?: TData) {
  const defaultFakeData = {
    boolParam: createCreatePetsBoolParamFaker(),
    offset: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createCreatePetsHeadersFaker<TData extends Partial<CreatePetsHeaders> = object>(data?: TData) {
  const defaultFakeData = {
    xEXAMPLE: createCreatePetsXEXAMPLEFaker(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
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

export function createCreatePetsBodyFaker<TData extends Partial<CreatePetsBody> = object>(data?: TData) {
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
  return faker.helpers.arrayElement([createCreatePetsStatus201Faker(), createCreatePetsStatusDefaultFaker()])
}
