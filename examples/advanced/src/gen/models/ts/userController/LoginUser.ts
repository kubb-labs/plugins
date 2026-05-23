/**
 * @description The user name for login
 * @type string | undefined
 */
export type LoginUserQueryUsername = string | undefined

/**
 * @description The password for login in clear text
 * @type string | undefined
 */
export type LoginUserQueryPassword = string | undefined

/**
 * @type object
 */
export type LoginUserRequestConfig = {
  data?: never
  pathParams?: never
  /**
   * @type object | undefined
   */
  queryParams?: {
    username?: LoginUserQueryUsername
    password?: LoginUserQueryPassword
  }
  headerParams?: never
  /**
   * @type string
   */
  url: '/user/login'
}

/**
 * @type object
 */
export type LoginUserResponses = {
  '200': LoginUserStatus200
  '400': LoginUserStatus400
}
