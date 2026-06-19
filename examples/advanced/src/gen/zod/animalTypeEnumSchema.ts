import * as z from 'zod'

export const animalTypeEnumSchema = z.enum(['cat', 'dog'])

export type AnimalTypeEnumSchemaType = z.infer<typeof animalTypeEnumSchema>
