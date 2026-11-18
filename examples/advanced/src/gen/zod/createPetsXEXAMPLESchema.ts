import * as z from 'zod'

/**
 * Header parameters
 */
export const createPetsXEXAMPLESchema = z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters')

export type CreatePetsXEXAMPLESchemaType = z.infer<typeof createPetsXEXAMPLESchema>
