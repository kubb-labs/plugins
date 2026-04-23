import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsQueryBoolParam,
  CreatePetsResponse,
  CreatePetsStatusDefault,
} from '../../models/ts/petsController/CreatePets.ts'
import { petNotFoundFaker } from '../petNotFound.ts'
import { faker } from '@faker-js/faker'

export function createPetsQueryBoolParam(data?: CreatePetsQueryBoolParam): CreatePetsQueryBoolParam {
  return data ?? faker.helpers.arrayElement<CreatePetsQueryBoolParam>([true])
}

export function createPetsPathUuid(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createPetsQueryOffset(data?: number): number {
  return data ?? faker.number.int()
}

export function createPetsHeaderXEXAMPLE(data?: CreatePetsHeaderXEXAMPLE): CreatePetsHeaderXEXAMPLE {
  return data ?? faker.helpers.arrayElement<CreatePetsHeaderXEXAMPLE>(['ONE', 'TWO', 'THREE'])
}

/**
 * @description Null response
 */
export function createPetsStatus201() {
  return undefined
}

/**
 * @description unexpected error
 */
export function createPetsStatusDefault(data?: Partial<CreatePetsStatusDefault>): CreatePetsStatusDefault {
  return petNotFoundFaker(data)
}

export function createPetsData(data?: Partial<CreatePetsData>): CreatePetsData {
  return {
    ...{ name: faker.string.alpha(), tag: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createPetsResponse(_data?: CreatePetsResponse): CreatePetsResponse {
  return faker.helpers.arrayElement<any>([createPetsStatus201(), createPetsStatusDefault()])
}
