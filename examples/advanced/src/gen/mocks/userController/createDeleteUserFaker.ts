import { faker } from '@faker-js/faker'

export function createDeleteUserPathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}
