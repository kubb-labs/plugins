import type {
  AddFilesData,
  AddFilesFormData,
  AddFilesJsonData,
  AddFilesResponse,
  AddFilesStatus200,
  AddFilesStatus405,
} from '../../models/ts/petController/AddFiles.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFilesStatus200Faker(data?: Partial<AddFilesStatus200>): AddFilesStatus200 {
  return createPetFaker(data) as AddFilesStatus200
}

/**
 * @description Invalid input
 */
export function createAddFilesStatus405Faker() {
  return undefined
}

export function createAddFilesDataFakerJson<TData extends Partial<AddFilesJsonData> = object>(data?: TData) {
  const defaultFakeData = {
    url: faker.internet.url(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createAddFilesDataFakerFormData(data?: Partial<AddFilesFormData>): AddFilesFormData {
  return createPetFaker(data) as AddFilesFormData
}

export function createAddFilesDataFaker(_data?: AddFilesData): AddFilesData {
  return faker.helpers.arrayElement<any>([createAddFilesDataFakerJson(), createAddFilesDataFakerFormData()])
}

export function createAddFilesResponseFaker(_data?: AddFilesResponse): AddFilesResponse {
  return faker.helpers.arrayElement<any>([createAddFilesStatus200Faker(), createAddFilesStatus405Faker()])
}
