import type { ApiResponse } from '../ApiResponse'

/**
 * @type object
 */
export type UploadFilePath = {
  /**
   * @description ID of pet to update
   *
   * Format: `int64`
   * @type integer
   */
  petId: number
}

/**
 * @type object
 */
export type UploadFileQuery = {
  /**
   * @description Additional Metadata
   * @type string | undefined
   */
  additionalMetadata?: string
}

/**
 * @type object
 */
export type UploadFileStatus200 = ApiResponse

/**
 * @type string
 */
export type UploadFileBody = Blob

/**
 * @type object
 */
export type UploadFileOptions = {
  body: UploadFileBody
  path: UploadFilePath
  query?: UploadFileQuery
  headers?: never
}

/**
 * @type object
 */
export type UploadFileResponses = {
  '200': UploadFileStatus200
}

/**
 * @description Union of all possible responses
 */
export type UploadFileResponse = UploadFileStatus200
