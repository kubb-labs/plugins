import { faker } from '@faker-js/faker'

export function imageFaker(data?: string): string {
  return data ?? faker.string.alpha()
}
