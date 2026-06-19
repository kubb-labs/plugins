import * as z from 'zod'
import { animalTypeEnumSchema } from './animalTypeEnumSchema.ts'
import { catSchema } from './catSchema.ts'
import { dogSchema } from './dogSchema.ts'

export const animalSchema = z
  .union([
    catSchema.and(
      z.object({
        type: z.enum(['cat']),
      }),
    ),
    dogSchema.and(
      z.object({
        type: z.enum(['dog']),
      }),
    ),
  ])
  .and(
    z
      .object({
        type: animalTypeEnumSchema,
      })
      .strict(),
  )

export type AnimalSchemaType = z.infer<typeof animalSchema>
