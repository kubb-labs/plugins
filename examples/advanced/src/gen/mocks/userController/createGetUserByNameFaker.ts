import { faker } from '@faker-js/faker'

export function createGetUserByNamePathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}
