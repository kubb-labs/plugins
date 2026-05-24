import type {
  CreateUserData,
  CreateUserFormUrlEncodedData,
  CreateUserJsonData,
  CreateUserResponse,
  CreateUserStatusDefault,
  CreateUserStatusDefaultJson,
  CreateUserStatusDefaultXml,
  CreateUserXmlData,
} from '../../models/ts/userController/CreateUser.ts'
import { createUserFaker } from '../createUserFaker.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createCreateUserStatusDefaultFakerJson(data?: Partial<CreateUserStatusDefaultJson>): CreateUserStatusDefaultJson {
  return createUserFaker(data)
}

/**
 * @description successful operation
 */
export function createCreateUserStatusDefaultFakerXml(data?: Partial<CreateUserStatusDefaultXml>): CreateUserStatusDefaultXml {
  return createUserFaker(data)
}

/**
 * @description successful operation
 */
export function createCreateUserStatusDefaultFaker(_data?: CreateUserStatusDefault): CreateUserStatusDefault {
  return faker.helpers.arrayElement<any>([createCreateUserStatusDefaultFakerJson(), createCreateUserStatusDefaultFakerXml()])
}

/**
 * @description Created user object
 */
export function createCreateUserDataFakerJson(data?: Partial<CreateUserJsonData>): CreateUserJsonData {
  return createUserFaker(data)
}

/**
 * @description Created user object
 */
export function createCreateUserDataFakerXml(data?: Partial<CreateUserXmlData>): CreateUserXmlData {
  return createUserFaker(data)
}

/**
 * @description Created user object
 */
export function createCreateUserDataFakerFormUrlEncoded(data?: Partial<CreateUserFormUrlEncodedData>): CreateUserFormUrlEncodedData {
  return createUserFaker(data)
}

/**
 * @description Created user object
 */
export function createCreateUserDataFaker(_data?: CreateUserData): CreateUserData {
  return faker.helpers.arrayElement<any>([createCreateUserDataFakerJson(), createCreateUserDataFakerXml(), createCreateUserDataFakerFormUrlEncoded()])
}

export function createCreateUserResponseFaker(data?: Partial<CreateUserResponse>): CreateUserResponse {
  return createCreateUserStatusDefaultFaker(data)
}
