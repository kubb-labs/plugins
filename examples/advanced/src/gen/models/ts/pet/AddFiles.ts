import type { Pet } from '../Pet'

export type AddFilesStatus200 = Omit<NonNullable<Pet>, 'name'>

export type AddFilesStatus405 = unknown

export type AddFilesBodyJson = {
  /**
   * @description URL of the image to upload
   *
   * Format: `uri`
   * @type string
   */
  url: string
}

export type AddFilesBodyFormData = Omit<NonNullable<Pet>, 'id'>

export type AddFilesBody = AddFilesBodyJson | AddFilesBodyFormData

export type AddFilesOptions = {
  body: AddFilesBody
  path?: never
  query?: never
  headers?: never
}

export type AddFilesResponses = {
  '200': AddFilesStatus200
  '405': AddFilesStatus405
}

/**
 * @description Union of all possible responses
 */
export type AddFilesResponse = AddFilesStatus200 | AddFilesStatus405
