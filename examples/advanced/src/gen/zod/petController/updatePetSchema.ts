import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const updatePetDataSchema = z.lazy(() => petSchema.omit({ id: true })).describe('Update an existent pet in the store')

export type UpdatePetDataSchema = z.infer<typeof updatePetDataSchema>
