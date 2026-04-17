import { faker } from '@faker-js/faker'
import type { LoginUserQueryParams } from '../../models/ts/userController/LoginUser.ts'

export function createLoginUserQueryParamsFaker(data?: Partial<LoginUserQueryParams>): LoginUserQueryParams {
  return {
    ...{ username: faker.string.alpha(), password: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createLoginUser200Faker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUser400Faker() {
  return undefined
}

export function createLoginUserQueryResponseFaker(data?: string): string {
  return data ?? faker.string.alpha()
}
