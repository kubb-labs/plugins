import type { Pet } from '../Pet.ts'

/**
 * @type string
 */
export type FindPetsByStatusPathStepId = string

/**
 * @type array
 */
export type FindPetsByStatusStatus200 = Array<Pet>

/**
 * @type any
 */
export type FindPetsByStatusStatus400 = any

/**
 * @type object
 */
export type FindPetsByStatusRequestConfig = {
  data?: never
  /**
   * @type object
   */
  pathParams: {
    stepId: FindPetsByStatusPathStepId
  }
  queryParams?: never
  headerParams?: never
  /**
   * @type string
   */
  url: `/pet/findByStatus/${string}`
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
