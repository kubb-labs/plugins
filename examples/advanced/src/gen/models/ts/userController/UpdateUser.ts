/**
 * @description name that need to be deleted
 * @type string
 */
export type UpdateUserPathUsername = string

/**
 * @type any
 */
export type UpdateUserStatusDefault = any

/**
 * @type object
 */
export type UpdateUserRequestConfig = {
  data?: never
  /**
   * @type object
   */
  pathParams: {
    username: UpdateUserPathUsername
  }
  queryParams?: never
  headerParams?: never
  /**
   * @type string
   */
  url: `/user/${string}`
}

/**
 * @type object
 */
export type UpdateUserResponses = {
  default: UpdateUserStatusDefault
}

/**
 * @description Union of all possible responses
 */
export type UpdateUserResponse = UpdateUserStatusDefault
