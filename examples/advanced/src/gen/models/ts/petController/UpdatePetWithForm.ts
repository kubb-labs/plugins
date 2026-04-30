/**
 * @description ID of pet that needs to be updated
 * @type integer
 */
export type UpdatePetWithFormPathPetId = number

/**
 * @description Name of pet that needs to be updated
 * @type string | undefined
 */
export type UpdatePetWithFormQueryName = string | undefined

/**
 * @description Status of pet that needs to be updated
 * @type string | undefined
 */
export type UpdatePetWithFormQueryStatus = string | undefined

/**
 * @type any
 */
export type UpdatePetWithFormStatus405 = any

/**
 * @type object
 */
export type UpdatePetWithFormRequestConfig = {
  data?: never
  /**
   * @type object
   */
  pathParams: {
    petId: UpdatePetWithFormPathPetId
  }
  /**
   * @type object | undefined
   */
  queryParams?: {
    name?: UpdatePetWithFormQueryName
    status?: UpdatePetWithFormQueryStatus
  }
  headerParams?: never
  /**
   * @type string
   */
  url: `/pet/${string}{search}${string}`
}

/**
 * @type object
 */
export type UpdatePetWithFormResponses = {
  '405': UpdatePetWithFormStatus405
}

/**
 * @description Union of all possible responses
 */
export type UpdatePetWithFormResponse = UpdatePetWithFormStatus405
