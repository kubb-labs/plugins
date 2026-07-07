import type {
  CreatePetsBody,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsQueryBoolParam,
  CreatePetsResponse,
  CreatePetsStatus201,
  CreatePetsStatusDefault,
} from '../../models/ts/pets/CreatePets.ts'
import { createCreatePetsBoolParam } from '../createCreatePetsBoolParam.ts'
import { createCreatePetsXEXAMPLE } from '../createCreatePetsXEXAMPLE.ts'
import { createPetNotFound } from '../createPetNotFound.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createCreatePetsQueryBoolParam(data?: Partial<CreatePetsQueryBoolParam>): CreatePetsQueryBoolParam {
  return createCreatePetsBoolParam(data) as CreatePetsQueryBoolParam
}

export function createCreatePetsPathUuid(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createCreatePetsQueryOffset(data?: number): number {
  return data ?? faker.number.int()
}

export function createCreatePetsHeaderXEXAMPLE(data?: Partial<CreatePetsHeaderXEXAMPLE>): CreatePetsHeaderXEXAMPLE {
  return createCreatePetsXEXAMPLE(data) as CreatePetsHeaderXEXAMPLE
}

/**
 * @description Null response
 */
export function createCreatePetsStatus201() {
  return undefined
}

/**
 * @description unexpected error
 */
export function createCreatePetsStatusDefault(data?: Partial<CreatePetsStatusDefault>): CreatePetsStatusDefault {
  return createPetNotFound(data) as CreatePetsStatusDefault
}

export function createCreatePetsBody<TData extends Partial<CreatePetsBody> = object>(data?: TData) {
  const defaultFakeData = {
    name: faker.string.alpha(),
    tag: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createCreatePetsResponse(_data?: CreatePetsResponse): CreatePetsResponse {
  return faker.helpers.arrayElement([createCreatePetsStatus201(), createCreatePetsStatusDefault()])
}
