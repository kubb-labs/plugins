import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const findPetsByStatusPathStepIdSchema = z.string()

export type FindPetsByStatusPathStepIdSchema = z.infer<typeof findPetsByStatusPathStepIdSchema>

export const findPetsByStatusStatus200Schema = z
  .array(petSchema)
  .min(1)
  .max(3)
  .refine((items) => new Set(items).size === items.length, { message: 'Array entries must be unique' })

export type FindPetsByStatusStatus200Schema = z.infer<typeof findPetsByStatusStatus200Schema>

export const findPetsByStatusStatus400Schema = z.any()

export type FindPetsByStatusStatus400Schema = z.infer<typeof findPetsByStatusStatus400Schema>
