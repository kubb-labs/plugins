import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const addFilesStatus200Schema = z.lazy(() => petSchema.omit({ name: true }))

export type AddFilesStatus200Schema = z.infer<typeof addFilesStatus200Schema>

export const addFilesStatus405Schema = z.any()

export type AddFilesStatus405Schema = z.infer<typeof addFilesStatus405Schema>

export const addFilesResponseSchema = z.union([addFilesStatus200Schema, addFilesStatus405Schema])

export type AddFilesResponseSchema = z.infer<typeof addFilesResponseSchema>

export const addFilesDataSchemaJson = z.object({
  url: z.url().describe('URL of the image to upload'),
})

export type AddFilesDataSchemaJson = z.infer<typeof addFilesDataSchemaJson>

export const addFilesDataSchemaFormData = z.lazy(() => petSchema.omit({ id: true }))

export type AddFilesDataSchemaFormData = z.infer<typeof addFilesDataSchemaFormData>

export const addFilesDataSchema = z.union([addFilesDataSchemaJson, addFilesDataSchemaFormData])

export type AddFilesDataSchema = z.infer<typeof addFilesDataSchema>
