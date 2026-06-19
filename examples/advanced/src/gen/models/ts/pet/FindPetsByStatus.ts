import type { Pet } from '../Pet.ts'

/**
 * @type string
 */
export type FindPetsByStatusPathStepId = string

/**
 * @type array
 */
export type FindPetsByStatusStatus200Json = Array<Pet>

/**
 * @type array
 */
export type FindPetsByStatusStatus200Xml = Array<Pet>

export type FindPetsByStatusStatus200 = FindPetsByStatusStatus200Json | FindPetsByStatusStatus200Xml

/**
 * @type any
 */
export type FindPetsByStatusStatus400 = any

/**
 * @type object
 */
export type FindPetsByStatusRequestConfig = {
  body?: never
  /**
   * @type object | undefined
   */
  path?: {
    stepId: FindPetsByStatusPathStepId
  }
  query?: never
  headers?: never
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
