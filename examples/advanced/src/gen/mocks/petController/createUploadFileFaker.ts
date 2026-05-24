import type { ApiResponse } from '../../models/ts/ApiResponse.ts'
import type { UploadFileResponse } from '../../models/ts/petController/UploadFile.ts'
import { createApiResponseFaker } from '../createApiResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createUploadFilePathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function createUploadFileQueryAdditionalMetadataFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createUploadFileStatus200Faker(data?: Partial<ApiResponse>): ApiResponse {
  return createApiResponseFaker(data)
}

export function createUploadFileDataFaker(data?: Blob): Blob {
  return data ?? (faker.image.url() as unknown as Blob)
}

export function createUploadFileResponseFaker(data?: Partial<UploadFileResponse>): UploadFileResponse {
  return createUploadFileStatus200Faker(data)
}
