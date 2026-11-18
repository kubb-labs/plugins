import * as z from 'zod'

export const deletePetHeaderApiKeySchema = z.string().optional()

export type DeletePetHeaderApiKeySchemaType = z.infer<typeof deletePetHeaderApiKeySchema>

/**
 * Pet id to delete
 */
export const deletePetPathPetIdSchema = z.int().describe('Pet id to delete')

export type DeletePetPathPetIdSchemaType = z.infer<typeof deletePetPathPetIdSchema>

export const deletePetStatus400Schema = z.unknown()

export type DeletePetStatus400SchemaType = z.infer<typeof deletePetStatus400Schema>

export const deletePetResponseSchema = z.unknown()

export type DeletePetResponseSchemaType = z.infer<typeof deletePetResponseSchema>

export const deletePetErrorSchema = deletePetStatus400Schema

export type DeletePetErrorSchemaType = z.infer<typeof deletePetErrorSchema>

export const deletePetPathSchema = z.object({
  petId: deletePetPathPetIdSchema,
})

export type DeletePetPathSchemaType = z.infer<typeof deletePetPathSchema>

export const deletePetHeadersSchema = z.object({
  api_key: deletePetHeaderApiKeySchema,
})

export type DeletePetHeadersSchemaType = z.infer<typeof deletePetHeadersSchema>

export const deletePetOptionsSchema = z.object({
  body: z.never().optional(),
  path: deletePetPathSchema,
  query: z.never().optional(),
  headers: deletePetHeadersSchema.optional(),
})

export type DeletePetOptionsSchemaType = z.infer<typeof deletePetOptionsSchema>

export const deletePetResponsesSchema = z.object({
  '400': deletePetStatus400Schema,
})

export type DeletePetResponsesSchemaType = z.infer<typeof deletePetResponsesSchema>
