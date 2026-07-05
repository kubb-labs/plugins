import type { CreatePetsBoolParamKey } from '../CreatePetsBoolParam.ts'
import type { CreatePetsXEXAMPLEKey } from '../CreatePetsXEXAMPLE.ts'
import type { PetNotFound } from '../PetNotFound.ts'

export type CreatePetsQueryBoolParam = CreatePetsBoolParamKey | undefined

/**
 * @description UUID
 * @type string
 */
export type CreatePetsPathUuid = string

/**
 * @description Offset *\/
 * @type integer | undefined
 */
export type CreatePetsQueryOffset = number | undefined

/**
 * @description Header parameters
 */
export type CreatePetsHeaderXEXAMPLE = CreatePetsXEXAMPLEKey

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
export type CreatePetsRequestConfig = {
  body: CreatePetsBody
  /**
   * @type object
   */
  path: {
    uuid: CreatePetsPathUuid
  }
  /**
   * @type object | undefined
   */
  query?: {
    boolParam?: CreatePetsQueryBoolParam
    offset?: CreatePetsQueryOffset
  }
  /**
   * @type object
   */
  headers: {
    xEXAMPLE: CreatePetsHeaderXEXAMPLE
  }
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
