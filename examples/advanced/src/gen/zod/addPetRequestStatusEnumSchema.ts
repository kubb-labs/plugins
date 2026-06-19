import * as z from 'zod'

export const addPetRequestStatusEnumSchema = z.enum(['available', 'pending', 'sold']).describe('pet status in the store')

export type AddPetRequestStatusEnumSchemaType = z.infer<typeof addPetRequestStatusEnumSchema>
