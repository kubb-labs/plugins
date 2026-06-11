import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const addFilesStatus200Schema = z.lazy(() => petSchema.omit({ name: true }))

export type AddFilesStatus200SchemaType = z.infer<typeof addFilesStatus200Schema>

export const addFilesStatus405Schema = z.any()

export type AddFilesStatus405SchemaType = z.infer<typeof addFilesStatus405Schema>

export const addFilesResponseSchema = addFilesStatus200Schema

export type AddFilesResponseSchemaType = z.infer<typeof addFilesResponseSchema>

export const addFilesDataSchemaJson = z.object({
  url: z.url().describe('URL of the image to upload'),
})

export type AddFilesDataSchemaJsonType = z.infer<typeof addFilesDataSchemaJson>

export const addFilesDataSchemaFormData = z.lazy(() => petSchema.omit({ id: true }))

export type AddFilesDataSchemaFormDataType = z.infer<typeof addFilesDataSchemaFormData>

export const addFilesDataSchema = z.union([addFilesDataSchemaJson, addFilesDataSchemaFormData])

export type AddFilesDataSchemaType = z.infer<typeof addFilesDataSchema>
