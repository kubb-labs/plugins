import type { GetUserByNameResponse, GetUserByNameStatus200 } from '../../models/ts/userController/GetUserByName.ts'
import { userFaker } from '../user.ts'
import { faker } from '@faker-js/faker'

export function getUserByNamePathUsername(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function getUserByNameStatus200(data?: Partial<GetUserByNameStatus200>): GetUserByNameStatus200 {
  return userFaker(data)
}

/**
 * @description Invalid username supplied
 */
export function getUserByNameStatus400() {
  return undefined
}

/**
 * @description User not found
 */
export function getUserByNameStatus404() {
  return undefined
}

export function getUserByNameResponse(_data?: GetUserByNameResponse): GetUserByNameResponse {
  return faker.helpers.arrayElement<any>([getUserByNameStatus200(), getUserByNameStatus400(), getUserByNameStatus404()])
}
