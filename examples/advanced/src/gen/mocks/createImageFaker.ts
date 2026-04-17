import { faker } from '@faker-js/faker'

export function createImageFaker(data?: string): string {
  return data ?? faker.string.alpha()
}
