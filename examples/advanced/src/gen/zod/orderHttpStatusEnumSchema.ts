import * as z from 'zod'

export const orderHttpStatusEnumSchema = z
  .union([z.literal(200), z.literal(400), z.literal(500)])
  .describe('HTTP Status')
  .meta({ examples: [200] })

export type OrderHttpStatusEnumSchemaType = z.infer<typeof orderHttpStatusEnumSchema>
