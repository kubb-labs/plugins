import * as z from 'zod'

export const findPetsByTagsXEXAMPLESchema = z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters')

export type FindPetsByTagsXEXAMPLESchemaType = z.infer<typeof findPetsByTagsXEXAMPLESchema>
