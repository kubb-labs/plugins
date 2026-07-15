import type { CreatePetsBoolParamKey } from '../CreatePetsBoolParam'
import type { CreatePetsXEXAMPLEKey } from '../CreatePetsXEXAMPLE'
import type { PetNotFound } from '../PetNotFound'

export type CreatePetsPath = {
  /**
   * @description UUID
   * @type string
   */
  uuid: string
}

export type CreatePetsQuery = {
  bool_param?: CreatePetsBoolParamKey
  /**
   * @description Offset *\/
   * @type integer | undefined
   */
  offset?: number
}

export type CreatePetsHeaders = {
  /**
   * @description Header parameters
   */
  'X-EXAMPLE': CreatePetsXEXAMPLEKey
}

export type CreatePetsStatus201 = unknown

/**
 * @description Pet not found
 * @type unknown
 */
export type CreatePetsStatusDefault = PetNotFound

export type CreatePetsBody = {
  name: string
  tag: string
}

export type CreatePetsOptions = {
  body: CreatePetsBody
  path: CreatePetsPath
  query?: CreatePetsQuery
  headers: CreatePetsHeaders
}

export type CreatePetsResponses = {
  '201': CreatePetsStatus201
  default: CreatePetsStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type CreatePetsResponse = CreatePetsStatus201 | CreatePetsStatusDefault
