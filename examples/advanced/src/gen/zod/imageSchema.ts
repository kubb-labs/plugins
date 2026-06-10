import * as z from 'zod'

export const imageSchema = z.string().nullable()

export type ImageSchemaType = z.infer<typeof imageSchema>
