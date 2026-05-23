import * as z from 'zod'

export const getPetByIdPathPetIdSchema = z.int().describe('ID of pet to return')

export type GetPetByIdPathPetIdSchema = z.infer<typeof getPetByIdPathPetIdSchema>
