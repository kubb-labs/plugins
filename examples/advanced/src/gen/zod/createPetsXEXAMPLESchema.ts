import * as z from 'zod'

export const createPetsXEXAMPLESchema = z.enum(['ONE', 'TWO', 'THREE']).describe('Header parameters')

export type CreatePetsXEXAMPLESchema = z.infer<typeof createPetsXEXAMPLESchema>
