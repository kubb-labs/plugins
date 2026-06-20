import type { Pet } from '../Pet.ts'

/**
 * @type object
 */
export type UpdatePetStatus200Json = Omit<NonNullable<Pet>, 'name'>

/**
 * @type object
 */
export type UpdatePetStatus200Xml = Omit<NonNullable<Pet>, 'name'>

export type UpdatePetStatus200 = UpdatePetStatus200Json | UpdatePetStatus200Xml

/**
 * @type object
 */
export type UpdatePetStatus202 = {
  /**
   * @description
   * Format: `int64`
   * @example 10
   * @type integer | undefined
   */
  id?: number
}

/**
 * @type any
 */
export type UpdatePetStatus400 = any

/**
 * @type any
 */
export type UpdatePetStatus404 = any

/**
 * @type any
 */
export type UpdatePetStatus405 = any

/**
 * @description Update an existent pet in the store
 * @type object
 */
export type UpdatePetJsonData = Omit<NonNullable<Pet>, 'id'>

/**
 * @description Update an existent pet in the store
 * @type object
 */
export type UpdatePetXmlData = Omit<NonNullable<Pet>, 'id'>

/**
 * @description Update an existent pet in the store
 * @type object
 */
export type UpdatePetFormUrlEncodedData = Omit<NonNullable<Pet>, 'id'>

export type UpdatePetData = UpdatePetJsonData | UpdatePetXmlData | UpdatePetFormUrlEncodedData

/**
 * @type object
 */
export type UpdatePetRequestConfig = {
  body: UpdatePetData
  path?: never
  query?: never
  headers?: never
}

/**
 * @type object
 */
export type UpdatePetResponses = {
  '200': UpdatePetStatus200
  '202': UpdatePetStatus202
  '400': UpdatePetStatus400
  '404': UpdatePetStatus404
  '405': UpdatePetStatus405
}

/**
 * @description Union of all possible responses
 */
export type UpdatePetResponse = UpdatePetStatus200 | UpdatePetStatus202 | UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405
