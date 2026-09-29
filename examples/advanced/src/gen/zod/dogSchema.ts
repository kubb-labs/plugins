import * as z from 'zod'
import { imageSchema } from './imageSchema'

export const dogSchema = z.strictObject({
  type: z.string().min(1),
  name: z.string(),
  image: imageSchema.nullish().meta({ examples: ['linode/debian10'] }),
})

export type DogSchemaType = z.infer<typeof dogSchema>
