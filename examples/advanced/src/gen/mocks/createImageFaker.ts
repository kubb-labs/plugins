import { fakerEN as faker } from '@faker-js/faker'

export function createImageFaker(data?: string | null): string | null {
  return data !== undefined ? data : faker.string.alpha()
}
