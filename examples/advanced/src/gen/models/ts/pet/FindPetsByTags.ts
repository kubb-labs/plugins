import type { FindPetsByTagsXEXAMPLEKey } from '../FindPetsByTagsXEXAMPLE'
import type { Pet } from '../Pet'

export type FindPetsByTagsQuery = {
  /**
   * @description Tags to filter by
   * @type array | undefined
   */
  tags?: Array<string>
  /**
   * @description to request with required page number or pagination
   * @type string | undefined
   */
  page?: string
  /**
   * @description to request with required page size
   * @type number | undefined
   */
  pageSize?: number
}

export type FindPetsByTagsHeaders = {
  /**
   * @description Header parameters
   */
  'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
}

export type FindPetsByTagsStatus200Json = Array<Pet>

export type FindPetsByTagsStatus200Xml = Array<Pet>

export type FindPetsByTagsStatus200 = FindPetsByTagsStatus200Json | FindPetsByTagsStatus200Xml

export type FindPetsByTagsStatus400 = unknown

export type FindPetsByTagsOptions = {
  body?: never
  path?: never
  query?: FindPetsByTagsQuery
  headers: FindPetsByTagsHeaders
}

export type FindPetsByTagsResponses = {
  '200':
    | {
        contentType: 'application/json'
        data: FindPetsByTagsStatus200Json
      }
    | {
        contentType: 'application/xml'
        data: FindPetsByTagsStatus200Xml
      }
  '400': FindPetsByTagsStatus400
}

/**
 * @description Union of all possible responses
 */
export type FindPetsByTagsResponse = FindPetsByTagsStatus200 | FindPetsByTagsStatus400
