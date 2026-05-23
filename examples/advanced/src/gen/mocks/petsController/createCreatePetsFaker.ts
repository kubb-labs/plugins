import type { CreatePetsData, CreatePetsHeaderXEXAMPLE, CreatePetsQueryBoolParam } from '../../models/ts/petsController/CreatePets.ts'
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

export function createCreatePetsDataFaker(data?: Partial<CreatePetsData>): Required<CreatePetsData> {
  const defaultFakeData = { name: faker.string.alpha(), tag: faker.string.alpha() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<CreatePetsData>
}
