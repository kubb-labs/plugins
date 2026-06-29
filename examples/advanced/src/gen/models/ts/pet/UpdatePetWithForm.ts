/**
 * @description ID of pet that needs to be updated
 *
 * Format: `int64`
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
 * @type unknown
 */
export type UpdatePetWithFormStatus405 = unknown

/**
 * @type object
 */
export type UpdatePetWithFormRequestConfig = {
  body?: never
  /**
   * @type object
   */
  path: {
    petId: UpdatePetWithFormPathPetId
  }
  /**
   * @type object | undefined
   */
  query?: {
    name?: UpdatePetWithFormQueryName
    status?: UpdatePetWithFormQueryStatus
  }
  headers?: never
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
