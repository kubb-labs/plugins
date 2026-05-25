import type { UpdateUserData, UpdateUserFormUrlEncodedData, UpdateUserJsonData, UpdateUserXmlData } from '../../models/ts/userController/UpdateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createUpdateUserPathUsernameFaker(data?: string): string {
  return data ?? faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createUpdateUserStatusDefaultFaker() {
  return undefined
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserDataFakerJson(data?: Partial<UpdateUserJsonData>): UpdateUserJsonData {
  return createUserFaker(data) as UpdateUserJsonData
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserDataFakerXml(data?: Partial<UpdateUserXmlData>): UpdateUserXmlData {
  return createUserFaker(data) as UpdateUserXmlData
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserDataFakerFormUrlEncoded(data?: Partial<UpdateUserFormUrlEncodedData>): UpdateUserFormUrlEncodedData {
  return createUserFaker(data) as UpdateUserFormUrlEncodedData
}

/**
 * @description Update an existent user in the store
 */
export function createUpdateUserDataFaker(_data?: UpdateUserData): UpdateUserData {
  return faker.helpers.arrayElement<any>([createUpdateUserDataFakerJson(), createUpdateUserDataFakerXml(), createUpdateUserDataFakerFormUrlEncoded()])
}

export function createUpdateUserResponseFaker() {
  return undefined
}
