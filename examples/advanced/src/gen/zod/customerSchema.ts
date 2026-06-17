import * as z from 'zod'
import { addressSchema } from './addressSchema.ts'
import { orderParamsSchema } from './orderParamsSchema.ts'

export const customerSchema = z.object({
  id: z
    .int()
    .optional()
    .meta({ examples: [100000] }),
  username: z
    .string()
    .optional()
    .meta({ examples: ['fehguy'] }),
  params: orderParamsSchema.optional(),
  address: z.array(addressSchema).optional(),
})

export type CustomerSchemaType = z.infer<typeof customerSchema>
