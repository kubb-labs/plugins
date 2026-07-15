import type { Pet } from '../Pet'

export type FindPetsByStatusPath = {
  step_id: string
}

export type FindPetsByStatusStatus200Json = Array<Pet>

export type FindPetsByStatusStatus200Xml = Array<Pet>

export type FindPetsByStatusStatus200 = FindPetsByStatusStatus200Json | FindPetsByStatusStatus200Xml

export type FindPetsByStatusStatus400 = unknown

export type FindPetsByStatusOptions = {
  body?: never
  path: FindPetsByStatusPath
  query?: never
  headers?: never
}

export type FindPetsByStatusResponses = {
  '200':
    | {
        contentType: 'application/json'
        data: FindPetsByStatusStatus200Json
      }
    | {
        contentType: 'application/xml'
        data: FindPetsByStatusStatus200Xml
      }
  '400': FindPetsByStatusStatus400
}

/**
 * @description Union of all possible responses
 */
export type FindPetsByStatusResponse = FindPetsByStatusStatus200 | FindPetsByStatusStatus400
