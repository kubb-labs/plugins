import type { AddFilesBody, AddFilesBodyFormData, AddFilesBodyJson, AddFilesResponse, AddFilesStatus200, AddFilesStatus405 } from '../../models/ts/pet/AddFiles'
import { createPetFaker } from '../createPetFaker'
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

export function createAddFilesBodyFakerJson<TData extends Partial<AddFilesBodyJson> = object>(data?: TData) {
  const defaultFakeData = {
    url: faker.internet.url(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createAddFilesBodyFakerFormData(data?: Partial<AddFilesBodyFormData>): AddFilesBodyFormData {
  return createPetFaker(data) as AddFilesBodyFormData
}

export function createAddFilesBodyFaker(_data?: AddFilesBody): AddFilesBody {
  return faker.helpers.arrayElement([createAddFilesBodyFakerJson(), createAddFilesBodyFakerFormData()])
}

export function createAddFilesResponseFaker(_data?: AddFilesResponse): AddFilesResponse {
  return faker.helpers.arrayElement([createAddFilesStatus200Faker(), createAddFilesStatus405Faker()])
}
