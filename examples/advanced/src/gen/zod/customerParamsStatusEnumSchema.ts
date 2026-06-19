import * as z from 'zod'

export const customerParamsStatusEnumSchema = z
  .enum(['placed', 'approved', 'delivered'])
  .describe('Order Status')
  .meta({ examples: ['approved'] })

export type CustomerParamsStatusEnumSchemaType = z.infer<typeof customerParamsStatusEnumSchema>
