import * as z from 'zod'

export const pingEventEventEnumSchema = z.enum(['ping'])

export type PingEventEventEnumSchemaType = z.infer<typeof pingEventEventEnumSchema>
