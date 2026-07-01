import * as z from 'zod'
import { animalTypeEnumSchema } from './animalTypeEnumSchema.ts'
import { catSchema } from './catSchema.ts'
import { dogSchema } from './dogSchema.ts'

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
    z
      .object({
        type: animalTypeEnumSchema,
      })
      .strict(),
  )

export type AnimalSchemaType = z.infer<typeof animalSchema>
