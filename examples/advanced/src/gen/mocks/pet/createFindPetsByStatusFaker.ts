import type {
  FindPetsByStatusPath,
  FindPetsByStatusResponse,
  FindPetsByStatusStatus200,
  FindPetsByStatusStatus200Json,
  FindPetsByStatusStatus200Xml,
  FindPetsByStatusStatus400,
} from '../../models/ts/pet/FindPetsByStatus'
import { createPetFaker } from '../createPetFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createFindPetsByStatusPathFaker<TData extends Partial<FindPetsByStatusPath> = object>(data?: TData) {
  const defaultFakeData = {
    step_id: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200FakerJson(data?: Partial<FindPetsByStatusStatus200Json>): FindPetsByStatusStatus200Json {
  return [
    ...faker.helpers.multiple(() => createPetFaker(), { count: { min: 1, max: 3 } }),
    ...(data || []).filter((item) => item !== undefined),
  ] as FindPetsByStatusStatus200Json
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200FakerXml(data?: Partial<FindPetsByStatusStatus200Xml>): FindPetsByStatusStatus200Xml {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || []).filter((item) => item !== undefined)] as FindPetsByStatusStatus200Xml
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200Faker(data?: Partial<FindPetsByStatusStatus200>): FindPetsByStatusStatus200 {
  return (data ??
    faker.helpers.arrayElement([createFindPetsByStatusStatus200FakerJson(), createFindPetsByStatusStatus200FakerXml()])) as FindPetsByStatusStatus200
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatusStatus400Faker() {
  return undefined
}

export function createFindPetsByStatusResponseFaker(data?: Partial<FindPetsByStatusResponse>): FindPetsByStatusResponse {
  return (data ?? faker.helpers.arrayElement([createFindPetsByStatusStatus200Faker(), createFindPetsByStatusStatus400Faker()])) as FindPetsByStatusResponse
}
