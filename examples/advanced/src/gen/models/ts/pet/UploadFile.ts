import type { ApiResponse } from '../ApiResponse.ts'

/**
 * @description ID of pet to update
 *
 * Format: `int64`
 * @type integer
 */
export type UploadFilePathPetId = number

/**
 * @description Additional Metadata
 * @type string | undefined
 */
export type UploadFileQueryAdditionalMetadata = string | undefined

/**
 * @type object
 */
export type UploadFileStatus200 = ApiResponse

/**
 * @type string
 */
export type UploadFileData = Blob

/**
 * @type object
 */
export type UploadFileRequestConfig = {
  body: UploadFileData
  /**
   * @type object | undefined
   */
  path?: {
    petId: UploadFilePathPetId
  }
  /**
   * @type object | undefined
   */
  query?: {
    additionalMetadata?: UploadFileQueryAdditionalMetadata
  }
  headers?: never
  /**
   * @type string
   */
  url: `/pet/${string}/uploadImage`
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
