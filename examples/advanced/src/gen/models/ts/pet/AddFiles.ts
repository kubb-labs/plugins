import type { Pet } from '../Pet.ts'

/**
 * @type object
 */
export type AddFilesStatus200 = Omit<NonNullable<Pet>, 'name'>

/**
 * @type unknown
 */
export type AddFilesStatus405 = unknown

/**
 * @type object
 */
export type AddFilesBodyJson = {
  /**
   * @description URL of the image to upload
   *
   * Format: `uri`
   * @type string
   */
  url: string
}

/**
 * @type object
 */
export type AddFilesBodyFormData = Omit<NonNullable<Pet>, 'id'>

export type AddFilesBody = AddFilesBodyJson | AddFilesBodyFormData

/**
 * @type object
 */
export type AddFilesOptions = {
  body: AddFilesBody
  path?: never
  query?: never
  headers?: never
}

/**
 * @type object
 */
export type AddFilesResponses = {
  '200': AddFilesStatus200
  '405': AddFilesStatus405
}

/**
 * @description Union of all possible responses
 */
export type AddFilesResponse = AddFilesStatus200 | AddFilesStatus405
