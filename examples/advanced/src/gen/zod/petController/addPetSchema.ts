import * as z from 'zod'
import { addPetRequestSchema } from '../addPetRequestSchema.ts'
import { petSchema } from '../petSchema.ts'

export const addPetStatus405Schema = z.object({
  code: z.int().optional(),
  message: z.string().optional(),
})

export type AddPetStatus405Schema = z.infer<typeof addPetStatus405Schema>

export const addPetStatusDefaultSchema = petSchema.omit({ name: true })

export type AddPetStatusDefaultSchema = z.infer<typeof addPetStatusDefaultSchema>

export const addPetResponseSchema = z.union([addPetStatus405Schema, addPetStatusDefaultSchema])

export type AddPetResponseSchema = z.infer<typeof addPetResponseSchema>

export const addPetDataSchema = addPetRequestSchema.describe('Create a new pet in the store')

export type AddPetDataSchema = z.infer<typeof addPetDataSchema>
