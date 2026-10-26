import * as z from 'zod'
import { animalTypeEnumSchema } from './animalTypeEnumSchema'
import { catSchema } from './catSchema'
import { dogSchema } from './dogSchema'

export const animalSchema = z.union([
  catSchema
    .extend({
      type: z.enum(['cat']),
    })
    .and(
      z.strictObject({
        type: animalTypeEnumSchema,
      }),
    ),
  dogSchema
    .extend({
      type: z.enum(['dog']),
    })
    .and(
      z.strictObject({
        type: animalTypeEnumSchema,
      }),
    ),
])

export type AnimalSchemaType = z.infer<typeof animalSchema>
