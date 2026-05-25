import type { AddPetRequest } from '../AddPetRequest.ts'
import type { Pet } from '../Pet.ts'

/**
 * @type object
 */
export type AddPetStatus405 = {
  /**
   * @description
   * Format: `int32`
   * @type integer | undefined
   */
  code?: number
  /**
   * @type string | undefined
   */
  message?: string
}

/**
 * @type object
 */
export type AddPetStatusDefault = Omit<NonNullable<Pet>, 'name'>

/**
 * @description Create a new pet in the store
 * @type object
 */
export type AddPetJsonData = AddPetRequest

/**
 * @description Create a new pet in the store
 * @type object
 */
export type AddPetXmlData = Omit<NonNullable<Pet>, 'id'>

/**
 * @description Create a new pet in the store
 * @type object
 */
export type AddPetFormUrlEncodedData = Omit<NonNullable<Pet>, 'id'>

export type AddPetData = AddPetJsonData | AddPetXmlData | AddPetFormUrlEncodedData

/**
 * @type object
 */
export type AddPetRequestConfig = {
  data?: AddPetData
  pathParams?: never
  queryParams?: never
  headerParams?: never
  /**
   * @type string
   */
  url: '/pet'
}

/**
 * @type object
 */
export type AddPetResponses = {
  '405': AddPetStatus405
  default: AddPetStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type AddPetResponse = AddPetStatus405 | AddPetStatusDefault
