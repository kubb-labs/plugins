import type { Pet } from '../Pet.ts'

/**
 * @description ID of pet to return
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
 * @type any
 */
export type GetPetByIdStatus400 = any

/**
 * @type any
 */
export type GetPetByIdStatus404 = any

/**
 * @type object
 */
export type GetPetByIdRequestConfig = {
  data?: never
  /**
   * @type object
   */
  pathParams: {
    petId: GetPetByIdPathPetId
  }
  queryParams?: never
  headerParams?: never
  /**
   * @type string
   */
  url: `/pet/${string}{search}${string}`
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
