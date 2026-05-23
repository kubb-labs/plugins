// version: 1.0.11

/**
 * @description The name that needs to be deleted
 * @type string
 */
export type DeleteUserPathUsername = string

/**
 * @type object
 */
export type DeleteUserRequestConfig = {
  data?: never
  /**
   * @type object
   */
  pathParams: {
    username: DeleteUserPathUsername
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
export type DeleteUserResponses = {
  '400': DeleteUserStatus400
  '404': DeleteUserStatus404
}
