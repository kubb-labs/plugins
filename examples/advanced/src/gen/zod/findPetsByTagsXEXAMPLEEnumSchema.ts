import * as z from 'zod'

/**
 * Header parameters
 */
export const findPetsByTagsXEXAMPLEEnumSchema = z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters')

export type FindPetsByTagsXEXAMPLEEnumSchemaType = z.infer<typeof findPetsByTagsXEXAMPLEEnumSchema>
