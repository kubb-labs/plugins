import * as z from 'zod'
import { pingEventEventEnumSchema } from './pingEventEventEnumSchema'

export const pingEventSchema = z.object({
  event: pingEventEventEnumSchema,
  data: z.string().optional(),
})

export type PingEventSchemaType = z.infer<typeof pingEventSchema>
