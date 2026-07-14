import type { CreatePetsBoolParamKey } from '../CreatePetsBoolParam'
import type { CreatePetsXEXAMPLEKey } from '../CreatePetsXEXAMPLE'
import type { PetNotFound } from '../PetNotFound'

/**
 * @type object
 */
export type CreatePetsPath = {
  /**
   * @description UUID
   * @type string
   */
  uuid: string
}

/**
 * @type object
 */
export type CreatePetsQuery = {
  bool_param?: CreatePetsBoolParamKey
  /**
   * @description Offset *\/
   * @type integer | undefined
   */
  offset?: number
}

/**
 * @type object
 */
export type CreatePetsHeaders = {
  /**
   * @description Header parameters
   */
  'X-EXAMPLE': CreatePetsXEXAMPLEKey
}

/**
 * @type unknown
 */
export type CreatePetsStatus201 = unknown

/**
 * @description Pet not found
 * @type unknown
 */
export type CreatePetsStatusDefault = PetNotFound

/**
 * @type object
 */
export type CreatePetsBody = {
  /**
   * @type string
   */
  name: string
  /**
   * @type string
   */
  tag: string
}

/**
 * @type object
 */
export type CreatePetsOptions = {
  body: CreatePetsBody
  path: CreatePetsPath
  query?: CreatePetsQuery
  headers: CreatePetsHeaders
}

/**
 * @type object
 */
export type CreatePetsResponses = {
  '201': CreatePetsStatus201
  default: CreatePetsStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type CreatePetsResponse = CreatePetsStatus201 | CreatePetsStatusDefault
