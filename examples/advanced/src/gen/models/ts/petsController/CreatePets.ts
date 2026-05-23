import type { PetNotFound } from '../PetNotFound.ts'

export const createPetsBoolParam = {
  true: true,
} as const

export type CreatePetsBoolParamKey = (typeof createPetsBoolParam)[keyof typeof createPetsBoolParam]

/**
 * @type boolean | undefined
 */
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

export const createPetsXEXAMPLE = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
} as const

export type CreatePetsXEXAMPLEKey = (typeof createPetsXEXAMPLE)[keyof typeof createPetsXEXAMPLE]

/**
 * @description Header parameters
 * @type string
 */
export type CreatePetsHeaderXEXAMPLE = CreatePetsXEXAMPLEKey

/**
 * @type any
 */
export type CreatePetsStatus201 = any

/**
 * @description Pet not found
 * @type any
 */
export type CreatePetsStatusDefault = PetNotFound

/**
 * @type object
 */
export type CreatePetsData = {
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
  data?: CreatePetsData
  /**
   * @type object
   */
  pathParams: {
    uuid: CreatePetsPathUuid
  }
  /**
   * @type object | undefined
   */
  queryParams?: {
    boolParam?: CreatePetsQueryBoolParam
    offset?: CreatePetsQueryOffset
  }
  /**
   * @type object | undefined
   */
  headerParams?: {
    xEXAMPLE: CreatePetsHeaderXEXAMPLE
  }
  /**
   * @type string
   */
  url: `/pets/${string}`
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
