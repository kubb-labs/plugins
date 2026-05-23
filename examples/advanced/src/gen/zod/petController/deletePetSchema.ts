import * as z from 'zod'

export const deletePetHeaderApiKeySchema = z.string().optional()

export type DeletePetHeaderApiKeySchema = z.infer<typeof deletePetHeaderApiKeySchema>

export const deletePetPathPetIdSchema = z.int().describe('Pet id to delete')

export type DeletePetPathPetIdSchema = z.infer<typeof deletePetPathPetIdSchema>
