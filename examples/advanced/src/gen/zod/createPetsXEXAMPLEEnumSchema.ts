import * as z from 'zod'

/**
 * Header parameters
 */
export const createPetsXEXAMPLEEnumSchema = z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters')

export type CreatePetsXEXAMPLEEnumSchemaType = z.infer<typeof createPetsXEXAMPLEEnumSchema>
