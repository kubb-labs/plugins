import * as z from 'zod'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'

export const addPetDataSchema = addPetRequestSchema.describe('Create a new pet in the store')

export type AddPetDataSchema = z.infer<typeof addPetDataSchema>
