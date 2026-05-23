import type { Pet } from '../Pet.ts'

/**
 * @type object
 */
export type AddFilesJsonData = {
  /**
   * @description URL of the image to upload
   * @type string
   */
  url: string
}

/**
 * @type object
 */
export type AddFilesFormData = Omit<NonNullable<Pet>, 'id'>

export type AddFilesData = AddFilesJsonData | AddFilesFormData

/**
 * @type object
 */
export type AddFilesRequestConfig = {
  data?: AddFilesData
  pathParams?: never
  queryParams?: never
  headerParams?: never
  /**
   * @type string
   */
  url: '/pet/files'
}

/**
 * @type object
 */
export type AddFilesResponses = {
  '200': AddFilesStatus200
  '405': AddFilesStatus405
}
