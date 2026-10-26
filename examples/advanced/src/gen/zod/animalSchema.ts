import * as z from 'zod'
import { animalTypeEnumSchema } from './animalTypeEnumSchema'
import { catSchema } from './catSchema'
import { dogSchema } from './dogSchema'

export const animalSchema = z
  .discriminatedUnion('type', [
    catSchema.extend({
      type: z.enum(['cat']),
    }),
    dogSchema.extend({
      type: z.enum(['dog']),
    }),
  ])
  .and(
    z.strictObject({
      type: animalTypeEnumSchema,
    }),
  )

export type AnimalSchemaType = z.infer<typeof animalSchema>
