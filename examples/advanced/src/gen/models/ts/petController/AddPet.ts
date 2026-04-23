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
 * @type object
 */
export type AddPetRequestConfig = {
  data?: never
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
