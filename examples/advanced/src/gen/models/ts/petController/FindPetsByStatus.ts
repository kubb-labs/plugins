/**
 * @type string
 */
export type FindPetsByStatusPathStepId = string

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
