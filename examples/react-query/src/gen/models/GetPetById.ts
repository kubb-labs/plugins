// version: 1.0.11

/**
 * @description ID of pet to return
 * @type integer
 */
export type GetPetByIdPathPetId = number

/**
 * @type object
 */
export type GetPetByIdRequestConfig = {
  data?: never
  /**
   * @type object
   */
  pathParams: {
    pet_id: GetPetByIdPathPetId
  }
  queryParams?: never
  headerParams?: never
  /**
   * @type string
   */
  url: `/pet/${string}`
}

/**
 * @type object
 */
export type GetPetByIdResponses = {
  '200': GetPetByIdStatus200
  '400': GetPetByIdStatus400
  '404': GetPetByIdStatus404
}
