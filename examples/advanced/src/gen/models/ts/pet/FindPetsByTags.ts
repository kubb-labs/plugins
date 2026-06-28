import type { FindPetsByTagsXEXAMPLEKey } from '../FindPetsByTagsXEXAMPLE.ts'
import type { Pet } from '../Pet.ts'

/**
 * @description Tags to filter by
 * @type array | undefined
 */
export type FindPetsByTagsQueryTags = Array<string> | undefined

/**
 * @description to request with required page number or pagination
 * @type string | undefined
 */
export type FindPetsByTagsQueryPage = string | undefined

/**
 * @description to request with required page size
 * @type number | undefined
 */
export type FindPetsByTagsQueryPageSize = number | undefined

/**
 * @description Header parameters
 */
export type FindPetsByTagsHeaderXEXAMPLE = FindPetsByTagsXEXAMPLEKey

/**
 * @type array
 */
export type FindPetsByTagsStatus200Json = Array<Pet>

/**
 * @type array
 */
export type FindPetsByTagsStatus200Xml = Array<Pet>

export type FindPetsByTagsStatus200 = FindPetsByTagsStatus200Json | FindPetsByTagsStatus200Xml

/**
 * @type unknown
 */
export type FindPetsByTagsStatus400 = unknown

/**
 * @type object
 */
export type FindPetsByTagsRequestConfig = {
  body?: never
  path?: never
  /**
   * @type object | undefined
   */
  query?: {
    tags?: FindPetsByTagsQueryTags
    page?: FindPetsByTagsQueryPage
    pageSize?: FindPetsByTagsQueryPageSize
  }
  /**
   * @type object
   */
  headers: {
    xEXAMPLE: FindPetsByTagsHeaderXEXAMPLE
  }
}

/**
 * @type object
 */
export type FindPetsByTagsResponses = {
  '200': FindPetsByTagsStatus200
  '400': FindPetsByTagsStatus400
}

/**
 * @description Union of all possible responses
 */
export type FindPetsByTagsResponse = FindPetsByTagsStatus200 | FindPetsByTagsStatus400
