import * as z from 'zod'
import { imageSchema } from './imageSchema'

export const dogSchema = z
  .object({
    type: z.string().min(1),
    name: z.string(),
    image: imageSchema.nullish().meta({ examples: ['linode/debian10'] }),
  })
  .strict()

export type DogSchemaType = z.infer<typeof dogSchema>
