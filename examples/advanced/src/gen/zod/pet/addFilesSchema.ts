import * as z from 'zod'
import { petSchema } from '../petSchema'

export const addFilesStatus200Schema = z.lazy(() => petSchema.omit({ name: true }))

export type AddFilesStatus200SchemaType = z.infer<typeof addFilesStatus200Schema>

export const addFilesStatus405Schema = z.unknown()

export type AddFilesStatus405SchemaType = z.infer<typeof addFilesStatus405Schema>

export const addFilesResponseSchema = addFilesStatus200Schema

export type AddFilesResponseSchemaType = z.infer<typeof addFilesResponseSchema>

export const addFilesErrorSchema = addFilesStatus405Schema

export type AddFilesErrorSchemaType = z.infer<typeof addFilesErrorSchema>

export const addFilesBodySchemaJson = z.object({
  url: z.url().describe('URL of the image to upload'),
})

export type AddFilesBodySchemaJsonType = z.infer<typeof addFilesBodySchemaJson>

export const addFilesBodySchemaFormData = z.lazy(() => petSchema.omit({ id: true }))

export type AddFilesBodySchemaFormDataType = z.infer<typeof addFilesBodySchemaFormData>

export const addFilesBodySchema = z.union([addFilesBodySchemaJson, addFilesBodySchemaFormData])

export type AddFilesBodySchemaType = z.infer<typeof addFilesBodySchema>

export const addFilesOptionsSchema = z.object({
  body: addFilesBodySchema,
  path: z.never().optional(),
  query: z.never().optional(),
  headers: z.never().optional(),
})

export type AddFilesOptionsSchemaType = z.infer<typeof addFilesOptionsSchema>
