import type {
  AddFilesData,
  AddFilesFormData,
  AddFilesJsonData,
  AddFilesResponse,
  AddFilesStatus200,
  AddFilesStatus405,
} from '../../models/ts/petController/AddFiles.ts'
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

export function createAddFilesDataFakerJson(data?: Partial<AddFilesJsonData>): Required<AddFilesJsonData> {
  const defaultFakeData = { url: faker.internet.url() }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Required<AddFilesJsonData>
}

export function createAddFilesDataFakerFormData(data?: Partial<AddFilesFormData>): AddFilesFormData {
  return createPetFaker(data)
}

export function createAddFilesDataFaker(_data?: AddFilesData): AddFilesData {
  return faker.helpers.arrayElement<any>([createAddFilesDataFakerJson(), createAddFilesDataFakerFormData()])
}

export function createAddFilesResponseFaker(_data?: AddFilesResponse): AddFilesResponse {
  return faker.helpers.arrayElement<any>([createAddFilesStatus200Faker(), createAddFilesStatus405Faker()])
}
