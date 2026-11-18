import * as z from 'zod'
import { apiResponseSchema } from '../apiResponseSchema'

/**
 * ID of pet to update
 */
export const uploadFilePathPetIdSchema = z.int().describe('ID of pet to update')

export type UploadFilePathPetIdSchemaType = z.infer<typeof uploadFilePathPetIdSchema>

/**
 * Additional Metadata
 */
export const uploadFileQueryAdditionalMetadataSchema = z.string().optional().describe('Additional Metadata')

export type UploadFileQueryAdditionalMetadataSchemaType = z.infer<typeof uploadFileQueryAdditionalMetadataSchema>

export const uploadFileStatus200Schema = apiResponseSchema

export type UploadFileStatus200SchemaType = z.infer<typeof uploadFileStatus200Schema>

export const uploadFileResponseSchema = uploadFileStatus200Schema

export type UploadFileResponseSchemaType = z.infer<typeof uploadFileResponseSchema>

export const uploadFileBodySchema = z.instanceof(Blob)

export type UploadFileBodySchemaType = z.infer<typeof uploadFileBodySchema>

export const uploadFilePathSchema = z.object({
  petId: uploadFilePathPetIdSchema,
})

export type UploadFilePathSchemaType = z.infer<typeof uploadFilePathSchema>

export const uploadFileQuerySchema = z.object({
  additionalMetadata: uploadFileQueryAdditionalMetadataSchema,
})

export type UploadFileQuerySchemaType = z.infer<typeof uploadFileQuerySchema>

export const uploadFileOptionsSchema = z.object({
  body: uploadFileBodySchema,
  path: uploadFilePathSchema,
  query: uploadFileQuerySchema.optional(),
  headers: z.never().optional(),
})

export type UploadFileOptionsSchemaType = z.infer<typeof uploadFileOptionsSchema>

export const uploadFileResponsesSchema = z.object({
  '200': uploadFileStatus200Schema,
})

export type UploadFileResponsesSchemaType = z.infer<typeof uploadFileResponsesSchema>
