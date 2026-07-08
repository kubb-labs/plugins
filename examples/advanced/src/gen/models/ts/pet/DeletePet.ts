/**
 * @type object
 */
export type DeletePetPath = {
  /**
   * @description Pet id to delete
   *
   * Format: `int64`
   * @type integer
   */
  petId: number
}

/**
 * @type object
 */
export type DeletePetHeaders = {
  /**
   * @type string | undefined
   */
  apiKey?: string
}

/**
 * @type unknown
 */
export type DeletePetStatus400 = unknown

/**
 * @type object
 */
export type DeletePetOptions = {
  body?: never
  path: DeletePetPath
  query?: never
  headers?: DeletePetHeaders
}

/**
 * @type object
 */
export type DeletePetResponses = {
  '400': DeletePetStatus400
}

/**
 * @description Union of all possible responses
 */
export type DeletePetResponse = DeletePetStatus400
