import * as z from 'zod'

export const uploadFilePathPetIdSchema = z.int().describe('ID of pet to update')

export type UploadFilePathPetIdSchema = z.infer<typeof uploadFilePathPetIdSchema>

export const uploadFileQueryAdditionalMetadataSchema = z.string().optional().describe('Additional Metadata')

export type UploadFileQueryAdditionalMetadataSchema = z.infer<typeof uploadFileQueryAdditionalMetadataSchema>

export const uploadFileDataSchema = z.instanceof(File)

export type UploadFileDataSchema = z.infer<typeof uploadFileDataSchema>
