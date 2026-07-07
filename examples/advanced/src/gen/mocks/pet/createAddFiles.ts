import type {
  AddFilesBody,
  AddFilesBodyFormData,
  AddFilesBodyJson,
  AddFilesResponse,
  AddFilesStatus200,
  AddFilesStatus405,
} from '../../models/ts/pet/AddFiles.ts'
import { createPet } from '../createPet.ts'
import { fakerEN as faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createAddFilesStatus200(data?: Partial<AddFilesStatus200>): AddFilesStatus200 {
  return createPet(data) as AddFilesStatus200
}

/**
 * @description Invalid input
 */
export function createAddFilesStatus405() {
  return undefined
}

export function createAddFilesBodyJson<TData extends Partial<AddFilesBodyJson> = object>(data?: TData) {
  const defaultFakeData = {
    url: faker.internet.url(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createAddFilesBodyFormData(data?: Partial<AddFilesBodyFormData>): AddFilesBodyFormData {
  return createPet(data) as AddFilesBodyFormData
}

export function createAddFilesBody(_data?: AddFilesBody): AddFilesBody {
  return faker.helpers.arrayElement([createAddFilesBodyJson(), createAddFilesBodyFormData()])
}

export function createAddFilesResponse(_data?: AddFilesResponse): AddFilesResponse {
  return faker.helpers.arrayElement([createAddFilesStatus200(), createAddFilesStatus405()])
}
