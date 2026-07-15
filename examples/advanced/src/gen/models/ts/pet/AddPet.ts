import type { AddPetRequest } from '../AddPetRequest'
import type { Pet } from '../Pet'

export type AddPetStatus405 = {
  /**
   * @description
   * Format: `int32`
   * @type integer | undefined
   */
  code?: number
  message?: string
}

export type AddPetStatusDefaultJson = Omit<NonNullable<Pet>, 'name'>

export type AddPetStatusDefaultXml = Omit<NonNullable<Pet>, 'name'>

export type AddPetStatusDefault = AddPetStatusDefaultJson | AddPetStatusDefaultXml

/**
 * @description Create a new pet in the store
 * @type object
 */
export type AddPetBodyJson = AddPetRequest

/**
 * @description Create a new pet in the store
 * @type object
 */
export type AddPetBodyXml = Omit<NonNullable<Pet>, 'id'>

/**
 * @description Create a new pet in the store
 * @type object
 */
export type AddPetBodyFormUrlEncoded = Omit<NonNullable<Pet>, 'id'>

export type AddPetBody = AddPetBodyJson | AddPetBodyXml | AddPetBodyFormUrlEncoded

export type AddPetOptions = {
  body: AddPetBody
  path?: never
  query?: never
  headers?: never
}

export type AddPetResponses = {
  '405': AddPetStatus405
  default:
    | {
        contentType: 'application/json'
        data: AddPetStatusDefaultJson
      }
    | {
        contentType: 'application/xml'
        data: AddPetStatusDefaultXml
      }
}

/**
 * @description Union of all possible responses
 */
export type AddPetResponse = AddPetStatus405 | AddPetStatusDefault
