import * as z from 'zod'

export const petStatusEnumSchema = z.enum(['available', 'pending', 'sold']).describe('pet status in the store')

export type PetStatusEnumSchema = z.infer<typeof petStatusEnumSchema>
