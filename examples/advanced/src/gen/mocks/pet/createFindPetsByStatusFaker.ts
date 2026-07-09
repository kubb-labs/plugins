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
    stepId: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200FakerJson(data?: FindPetsByStatusStatus200Json): FindPetsByStatusStatus200Json {
  return [...faker.helpers.multiple(() => createPetFaker(), { count: { min: 1, max: 3 } }), ...(data || [])]
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200FakerXml(data?: FindPetsByStatusStatus200Xml): FindPetsByStatusStatus200Xml {
  return [...faker.helpers.multiple(() => createPetFaker()), ...(data || [])]
}

/**
 * @description successful operation
 */
export function createFindPetsByStatusStatus200Faker(_data?: FindPetsByStatusStatus200): FindPetsByStatusStatus200 {
  return faker.helpers.arrayElement([createFindPetsByStatusStatus200FakerJson(), createFindPetsByStatusStatus200FakerXml()])
}

/**
 * @description Invalid status value
 */
export function createFindPetsByStatusStatus400Faker() {
  return undefined
}

export function createFindPetsByStatusResponseFaker(_data?: FindPetsByStatusResponse): FindPetsByStatusResponse {
  return faker.helpers.arrayElement([createFindPetsByStatusStatus200Faker(), createFindPetsByStatusStatus400Faker()])
}
