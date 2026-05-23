import { faker } from '@faker-js/faker'

export function createUploadFilePathPetIdFaker(data?: number): number {
  return data ?? faker.number.int()
}

export function createUploadFileQueryAdditionalMetadataFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createUploadFileDataFaker(data?: Blob): Blob {
  return data ?? (faker.image.url() as unknown as Blob)
}
