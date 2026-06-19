import * as z from 'zod'
import { addressSchema } from './addressSchema.ts'
import { customerParamsStatusEnumSchema } from './customerParamsStatusEnumSchema.ts'

export const customerSchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [100000] }),
  username: z
    .string()
    .optional()
    .meta({ examples: ['fehguy'] }),
  params: z
    .object({
      status: customerParamsStatusEnumSchema.describe('Order Status').meta({ examples: ['approved'] }),
      type: z.string(),
    })
    .optional(),
  address: z.array(addressSchema).optional(),
})

export type CustomerSchemaType = z.infer<typeof customerSchema>
