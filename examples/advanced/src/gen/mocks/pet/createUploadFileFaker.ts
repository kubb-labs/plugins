import type { UploadFileResponse, UploadFileStatus200 } from '../../models/ts/pet/UploadFile.ts'
import { createApiResponseFaker } from '../createApiResponseFaker.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createUploadFilePathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function createUploadFileQueryAdditionalMetadataFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createUploadFileStatus200Faker(data?: Partial<UploadFileStatus200>): UploadFileStatus200 {
  return createApiResponseFaker(data) as UploadFileStatus200
}

export function createUploadFileResponseFaker(data?: Partial<UploadFileResponse>): UploadFileResponse {
  return createUploadFileStatus200Faker(data) as UploadFileResponse
}
