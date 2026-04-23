import type { AddPetRequest } from '../AddPetRequest.ts'
import type { Pet } from '../Pet.ts'

/**
 * @type object
 */
export type AddPetStatus405 = {
  /**
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
export type AddPetData = AddPetRequest

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
