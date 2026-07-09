import * as z from 'zod'
import { addPetRequestStatusEnumSchema } from './addPetRequestStatusEnumSchema'
import { categorySchema } from './categorySchema'
import { tagTagSchema } from './tag/tagSchema'

export const addPetRequestSchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [10] }),
  name: z.string().meta({ examples: ['doggie'] }),
  category: categorySchema.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(tagTagSchema).optional(),
  status: addPetRequestStatusEnumSchema.optional().describe('pet status in the store'),
})

export type AddPetRequestSchemaType = z.infer<typeof addPetRequestSchema>
