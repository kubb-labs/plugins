import { fakerEN as faker } from '@faker-js/faker'

export function createImage(data?: string): string {
  return data ?? faker.string.alpha()
}
