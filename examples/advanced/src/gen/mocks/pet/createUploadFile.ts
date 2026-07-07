import type { UploadFileResponse, UploadFileStatus200 } from '../../models/ts/pet/UploadFile.ts'
import { createApiResponse } from '../createApiResponse.ts'
import { fakerEN as faker } from '@faker-js/faker'

export function createUploadFilePathPetId(data?: number): number {
  return data ?? faker.number.int()
}

export function createUploadFileQueryAdditionalMetadata(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createUploadFileStatus200(data?: Partial<UploadFileStatus200>): UploadFileStatus200 {
  return createApiResponse(data) as UploadFileStatus200
}

export function createUploadFileBody(data?: Blob): Blob {
  return data ?? (faker.image.url() as unknown as Blob)
}

export function createUploadFileResponse(data?: Partial<UploadFileResponse>): UploadFileResponse {
  return createUploadFileStatus200(data) as UploadFileResponse
}
