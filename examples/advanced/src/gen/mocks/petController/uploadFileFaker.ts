import { faker } from '@faker-js/faker'
import type { UploadFileResponse, UploadFileStatus200 } from '../../models/ts/petController/UploadFile.ts'
import { apiResponseFaker } from '../apiResponseFaker.ts'

export function uploadFilePathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function uploadFileQueryAdditionalMetadataFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function uploadFileStatus200Faker(data?: Partial<UploadFileStatus200>): UploadFileStatus200 {
  return apiResponseFaker(data)
}

export function uploadFileDataFaker(data?: Blob): Blob {
  return data ?? (faker.image.url() as unknown as Blob)
}

export function uploadFileResponseFaker(data?: Partial<UploadFileResponse>): UploadFileResponse {
  return uploadFileStatus200Faker(data)
}
