import type { Pet } from '../Pet'

export type UpdatePetStatus200Json = Omit<NonNullable<Pet>, 'name'>

export type UpdatePetStatus200Xml = Omit<NonNullable<Pet>, 'name'>

export type UpdatePetStatus200 = UpdatePetStatus200Json | UpdatePetStatus200Xml

export type UpdatePetStatus202 = {
  /**
   * @description
   * Format: `int64`
   * @example 10
   * @type integer | undefined
   */
  id?: number
}

export type UpdatePetStatus400 = unknown

export type UpdatePetStatus404 = unknown

export type UpdatePetStatus405 = unknown

/**
 * @description Update an existent pet in the store
 * @type object
 */
export type UpdatePetBodyJson = Omit<NonNullable<Pet>, 'id'>

/**
 * @description Update an existent pet in the store
 * @type object
 */
export type UpdatePetBodyXml = Omit<NonNullable<Pet>, 'id'>

/**
 * @description Update an existent pet in the store
 * @type object
 */
export type UpdatePetBodyFormUrlEncoded = Omit<NonNullable<Pet>, 'id'>

export type UpdatePetBody = UpdatePetBodyJson | UpdatePetBodyXml | UpdatePetBodyFormUrlEncoded

export type UpdatePetOptions = {
  body: UpdatePetBody
  path?: never
  query?: never
  headers?: never
}

export type UpdatePetResponses = {
  '200':
    | {
        contentType: 'application/json'
        data: UpdatePetStatus200Json
      }
    | {
        contentType: 'application/xml'
        data: UpdatePetStatus200Xml
      }
  '202': UpdatePetStatus202
  '400': UpdatePetStatus400
  '404': UpdatePetStatus404
  '405': UpdatePetStatus405
}

/**
 * @description Union of all possible responses
 */
export type UpdatePetResponse = UpdatePetStatus200 | UpdatePetStatus202 | UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405
