import { faker } from '@faker-js/faker'

export function createLoginUserQueryUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

export function createLoginUserQueryPasswordFaker(data?: string): string {
  return data ?? faker.string.alpha()
}
