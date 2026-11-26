import type { CreatePetsXEXAMPLEEnumKey } from '../../models/ts/CreatePetsXEXAMPLEEnum'
import { createCreatePetsXEXAMPLEEnumFaker } from '../createCreatePetsXEXAMPLEEnumFaker'
import { fakerEN as faker } from '@faker-js/faker'

type CreatePetsQuery = {
  bool_param?: true
  offset?: number
}

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

export function createCreatePetsQueryFaker<TData extends Partial<CreatePetsQuery> = object>(data?: TData) {
  const defaultFakeData = {
    bool_param: faker.helpers.arrayElement([true] as Array<NonNullable<CreatePetsQuery>['bool_param']>),
    offset: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createCreatePetsHeadersFaker<
  TData extends Partial<{
    'X-EXAMPLE': CreatePetsXEXAMPLEEnumKey
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    'X-EXAMPLE': createCreatePetsXEXAMPLEEnumFaker(),
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

export function createCreatePetsResponseFaker() {
  return undefined
}
