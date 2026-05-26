// version: 1.0.11

import type { Pet } from './Pet.ts'
import type { PetStatusEnumKey } from './PetStatusEnum.ts'

/**
 * @description Status values that need to be considered for filter
 * @default available
 */
export type FindPetsByStatusQueryStatus = PetStatusEnumKey | undefined

/**
 * @type array
 */
export type FindPetsByStatusStatus200Json = Pet[]

/**
 * @type array
 */
export type FindPetsByStatusStatus200Xml = Pet[]

export type FindPetsByStatusStatus200 = FindPetsByStatusStatus200Json | FindPetsByStatusStatus200Xml

/**
 * @type any
 */
export type FindPetsByStatusStatus400 = any

/**
 * @type object
 */
export type FindPetsByStatusRequestConfig = {
  data?: never
  pathParams?: never
  /**
   * @type object | undefined
   */
  queryParams?: {
    status?: FindPetsByStatusQueryStatus
  }
  headerParams?: never
  /**
   * @type string
   */
  url: '/pet/findByStatus'
}

/**
 * @type object
 */
export type FindPetsByStatusResponses = {
  '200': FindPetsByStatusStatus200
  '400': FindPetsByStatusStatus400
}

/**
 * @description Union of all possible responses
 */
export type FindPetsByStatusResponse = FindPetsByStatusStatus200 | FindPetsByStatusStatus400
