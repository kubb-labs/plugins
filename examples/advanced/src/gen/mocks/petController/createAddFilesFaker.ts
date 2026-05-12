import type { AddFilesData, AddFilesResponse, AddFilesStatus200, AddFilesStatus405 } from '../../models/ts/petController/AddFiles.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFilesStatus200Faker(data?: Partial<AddFilesStatus200>): AddFilesStatus200 {
  return createPetFaker(data)
}

/**
 * @description Invalid input
 */
export function createAddFilesStatus405Faker() {
  return undefined
}

export function createAddFilesDataFaker(data?: Partial<AddFilesData>): Required<AddFilesData> {
  const defaultFakeData = { url: faker.internet.url() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<AddFilesData>
}

export function createAddFilesResponseFaker(_data?: AddFilesResponse): AddFilesResponse {
  return faker.helpers.arrayElement<any>([createAddFilesStatus200Faker(), createAddFilesStatus405Faker()])
}
