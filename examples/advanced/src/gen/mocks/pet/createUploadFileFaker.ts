import type { UploadFilePath, UploadFileQuery, UploadFileResponse, UploadFileStatus200 } from '../../models/ts/pet/UploadFile'
import { createApiResponseFaker } from '../createApiResponseFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createUploadFilePathFaker<TData extends Partial<UploadFilePath> = object>(data?: TData) {
  const defaultFakeData = {
    petId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

export function createUploadFileQueryFaker<TData extends Partial<UploadFileQuery> = object>(data?: TData) {
  const defaultFakeData = {
    additionalMetadata: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof TData> & TData
}

/**
 * @description successful operation
 */
export function createUploadFileStatus200Faker(data?: Partial<UploadFileStatus200>): UploadFileStatus200 {
  return createApiResponseFaker(data) as UploadFileStatus200
}

export function createUploadFileBodyFaker(data?: Blob): Blob {
  return data ?? (faker.image.url() as unknown as Blob)
}

export function createUploadFileResponseFaker(data?: Partial<UploadFileResponse>): UploadFileResponse {
  return createUploadFileStatus200Faker(data) as UploadFileResponse
}
