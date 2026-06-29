import * as z from 'zod'

export const deletePetHeaderApiKeySchema = z.string().optional()

export type DeletePetHeaderApiKeySchemaType = z.infer<typeof deletePetHeaderApiKeySchema>

export const deletePetPathPetIdSchema = z.int().describe('Pet id to delete')

export type DeletePetPathPetIdSchemaType = z.infer<typeof deletePetPathPetIdSchema>

export const deletePetStatus400Schema = z.unknown()

export type DeletePetStatus400SchemaType = z.infer<typeof deletePetStatus400Schema>

export const deletePetResponseSchema = z.unknown()

export type DeletePetResponseSchemaType = z.infer<typeof deletePetResponseSchema>

export const deletePetErrorSchema = deletePetStatus400Schema

export type DeletePetErrorSchemaType = z.infer<typeof deletePetErrorSchema>
