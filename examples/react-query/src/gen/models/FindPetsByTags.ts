// version: 1.0.11

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
  headerParams?: never
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
