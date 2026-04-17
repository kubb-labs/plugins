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
 * @type string
 */
export type FindPetsByTagsHeaderXEXAMPLE = 'ONE' | 'TWO' | 'THREE'

/**
 * @type array
 */
export type FindPetsByTagsStatus200 = Array<Pet>

/**
 * @type any
 */
export type FindPetsByTagsStatus400 = any

/**
 * @type object
 */
export type FindPetsByTagsRequestConfig = {
  data?: never
  pathParams?: never
  /**
   * @type object | undefined
   */
  queryParams?: {
    tags?: FindPetsByTagsQueryTags
    page?: FindPetsByTagsQueryPage
    pageSize?: FindPetsByTagsQueryPageSize
  }
  /**
   * @type object | undefined
   */
  headerParams?: {
    xEXAMPLE: FindPetsByTagsHeaderXEXAMPLE
  }
  /**
   * @type string
   */
  url: '/pet/findByTags'
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
