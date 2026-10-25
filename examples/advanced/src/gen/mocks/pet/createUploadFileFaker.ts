import type { ApiResponse } from '../../models/ts/ApiResponse'
import { createApiResponseFaker } from '../createApiResponseFaker'
import { fakerEN as faker } from '@faker-js/faker'

export function createUploadFilePathFaker<
  TData extends Partial<{
    petId: number
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    petId: faker.number.int(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

export function createUploadFileQueryFaker<
  TData extends Partial<{
    additionalMetadata?: string
  }> = object,
>(data?: TData) {
  const defaultFakeData = {
    additionalMetadata: faker.string.alpha(),
  }
  return {
    ...defaultFakeData,
    ...(data || {}),
  } as Omit<typeof defaultFakeData, keyof NoInfer<TData>> & NoInfer<TData>
}

/**
 * @description successful operation
 */
export function createUploadFileStatus200Faker(data?: Partial<ApiResponse>): ApiResponse {
  return createApiResponseFaker(data) as ApiResponse
}

export function createUploadFileBodyFaker(data?: Blob): Blob {
  return data ?? (faker.image.url() as unknown as Blob)
}

export function createUploadFileResponseFaker(data?: Partial<ApiResponse>): ApiResponse {
  return createUploadFileStatus200Faker(data) as ApiResponse
}
