import { faker } from '@faker-js/faker'

export function updateUserPathUsername(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function updateUserStatusDefault() {
  return undefined
}

export function updateUserResponse() {
  return undefined
}
