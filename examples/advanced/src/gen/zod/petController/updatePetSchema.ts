import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const updatePetStatus200Schema = petSchema.omit({ name: true })

export type UpdatePetStatus200Schema = z.infer<typeof updatePetStatus200Schema>

export const updatePetStatus202Schema = z.object({
  id: z.int().optional(),
})

export type UpdatePetStatus202Schema = z.infer<typeof updatePetStatus202Schema>

export const updatePetStatus400Schema = z.any()

export type UpdatePetStatus400Schema = z.infer<typeof updatePetStatus400Schema>

export const updatePetStatus404Schema = z.any()

export type UpdatePetStatus404Schema = z.infer<typeof updatePetStatus404Schema>

export const updatePetStatus405Schema = z.any()

export type UpdatePetStatus405Schema = z.infer<typeof updatePetStatus405Schema>

export const updatePetDataSchema = petSchema.omit({ id: true }).describe('Update an existent pet in the store')

export type UpdatePetDataSchema = z.infer<typeof updatePetDataSchema>
