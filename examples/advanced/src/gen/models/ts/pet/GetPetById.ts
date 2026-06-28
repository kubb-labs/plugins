import type { Pet } from '../Pet.ts'

/**
 * @description ID of pet to return
 *
 * Format: `int64`
 * @type integer
 */
export type GetPetByIdPathPetId = number

/**
 * @type object
 */
export type GetPetByIdStatus200Json = Omit<NonNullable<Pet>, 'name'>

/**
 * @type object
 */
export type GetPetByIdStatus200Xml = Omit<NonNullable<Pet>, 'name'>

export type GetPetByIdStatus200 = GetPetByIdStatus200Json | GetPetByIdStatus200Xml

/**
 * @type unknown
 */
export type GetPetByIdStatus400 = unknown

/**
 * @type unknown
 */
export type GetPetByIdStatus404 = unknown

/**
 * @type object
 */
export type GetPetByIdRequestConfig = {
  body?: never
  /**
   * @type object
   */
  path: {
    petId: GetPetByIdPathPetId
  }
  query?: never
  headers?: never
}

/**
 * @type object
 */
export type GetPetByIdResponses = {
  '200': GetPetByIdStatus200
  '400': GetPetByIdStatus400
  '404': GetPetByIdStatus404
}

/**
 * @description Union of all possible responses
 */
export type GetPetByIdResponse = GetPetByIdStatus200 | GetPetByIdStatus400 | GetPetByIdStatus404
