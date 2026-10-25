import type { CreatePetsBoolParamKey } from '../../models/ts/CreatePetsBoolParam'
import type { CreatePetsXEXAMPLEKey } from '../../models/ts/CreatePetsXEXAMPLE'
import { createCreatePetsBoolParamFaker } from '../createCreatePetsBoolParamFaker'
import { createCreatePetsXEXAMPLEFaker } from '../createCreatePetsXEXAMPLEFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createCreatePetsPathFaker<
  TData extends Partial<{
    uuid: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    uuid: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createCreatePetsQueryFaker<
  TData extends Partial<{
    bool_param?: CreatePetsBoolParamKey
    offset?: number
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    bool_param: createCreatePetsBoolParamFaker(),
    offset: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createCreatePetsHeadersFaker<
  TData extends Partial<{
    'X-EXAMPLE': CreatePetsXEXAMPLEKey
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    'X-EXAMPLE': createCreatePetsXEXAMPLEFaker(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
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
export function createCreatePetsStatusDefaultFaker() {
  return undefined
}

export function createCreatePetsBodyFaker<
  TData extends Partial<{
    name: string
    tag: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    name: faker.string.alpha(),
    tag: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createCreatePetsResponseFaker(data?: Partial<unknown>): unknown {
  return (data ?? faker.helpers.arrayElement([createCreatePetsStatus201Faker(), createCreatePetsStatusDefaultFaker()])) as unknown
}
