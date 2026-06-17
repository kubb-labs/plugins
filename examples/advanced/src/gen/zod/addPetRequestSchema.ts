import * as z from 'zod'
import { categorySchema } from './categorySchema.ts'
import { petStatusEnumSchema } from './petStatusEnumSchema.ts'

export const addPetRequestSchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [10] }),
  name: z.string().meta({ examples: ['doggie'] }),
  category: categorySchema.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(categorySchema).optional(),
  status: petStatusEnumSchema.optional().describe('pet status in the store'),
})

export type AddPetRequestSchemaType = z.infer<typeof addPetRequestSchema>
