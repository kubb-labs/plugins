import * as z from 'zod'

/**
 * pet status in the store
 */
export const petStatusEnumSchema = z.enum(['available', 'pending', 'sold']).describe('pet status in the store')

export type PetStatusEnumSchemaType = z.infer<typeof petStatusEnumSchema>
