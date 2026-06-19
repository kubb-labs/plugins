import * as z from 'zod'

export const orderOrderTypeEnumSchema = z.enum(['foo', 'bar'])

export type OrderOrderTypeEnumSchemaType = z.infer<typeof orderOrderTypeEnumSchema>
