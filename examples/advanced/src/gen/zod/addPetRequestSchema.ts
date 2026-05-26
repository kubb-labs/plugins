import * as z from 'zod'
import { categorySchema } from './categorySchema.ts'
import { petStatusEnumSchema } from './petStatusEnumSchema.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const addPetRequestSchema = z.object({
  id: z.int().optional(),
  name: z.string(),
  category: categorySchema.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(tagTagSchema).optional(),
  status: petStatusEnumSchema.optional().describe('pet status in the store'),
})

export type AddPetRequestSchema = z.infer<typeof addPetRequestSchema>
