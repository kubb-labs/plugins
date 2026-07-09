import * as z from 'zod'
import { categorySchema } from './categorySchema'
import { petStatusEnumSchema } from './petStatusEnumSchema'
import { tagTagSchema } from './tag/tagSchema'

export const petSchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [10] }),
  get parent() {
    return z.array(petSchema).optional()
  },
  signature: z
    .string()
    .regex(/^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
    .optional(),
  name: z.string().meta({ examples: ['doggie'] }),
  url: z.url().max(255).optional(),
  category: categorySchema.optional(),
  photoUrls: z.array(z.string()),
  tags: z.array(tagTagSchema).optional(),
  status: petStatusEnumSchema.optional().describe('pet status in the store'),
})

export type PetSchemaType = z.infer<typeof petSchema>
