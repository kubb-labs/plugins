// version: 1.0.11

import type { Pet } from './Pet.ts'

/**
 * @description Tags to filter by
 * @type array | undefined
 */
export type FindPetsByTagsQueryTags = string[] | undefined

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
 * @type array
 */
export type FindPetsByTagsStatus200Json = Pet[]

/**
 * @type array
 */
export type FindPetsByTagsStatus200Xml = Pet[]

export type FindPetsByTagsStatus200 = FindPetsByTagsStatus200Json | FindPetsByTagsStatus200Xml

/**
 * @type any
 */
export type FindPetsByTagsStatus400 = any

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
  headers?: never
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
