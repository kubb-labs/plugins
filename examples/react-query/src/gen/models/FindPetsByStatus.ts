// version: 1.0.11

export const findPetsByStatusStatus = {
  available: 'available',
  pending: 'pending',
  sold: 'sold',
} as const

export type FindPetsByStatusStatusKey = (typeof findPetsByStatusStatus)[keyof typeof findPetsByStatusStatus]

/**
 * @description Status values that need to be considered for filter
 * @default "available"
 * @type string | undefined
 */
export type FindPetsByStatusQueryStatus = FindPetsByStatusStatusKey | undefined

/**
 * @type object
 */
export type FindPetsByStatusRequestConfig = {
  data?: never
  pathParams?: never
  /**
   * @type object | undefined
   */
  queryParams?: {
    status?: FindPetsByStatusQueryStatus
  }
  headerParams?: never
  /**
   * @type string
   */
  url: '/pet/findByStatus'
}

/**
 * @type object
 */
export type FindPetsByStatusResponses = {
  '200': FindPetsByStatusStatus200
  '400': FindPetsByStatusStatus400
}
