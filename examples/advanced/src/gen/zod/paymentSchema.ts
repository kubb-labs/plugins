import * as z from 'zod'
import { paymentMethodEnumSchema } from './paymentMethodEnumSchema'

export const paymentSchema = z
  .pipe(
    z.unknown().check(
      z.refine((value) => typeof value !== 'object' || value === null || Array.isArray(value) || Object.keys(value).length >= 1, {
        message: 'Object must have at least 1 properties',
      }),
      z.refine((value) => typeof value !== 'object' || value === null || Array.isArray(value) || Object.keys(value).length <= 10, {
        message: 'Object must have at most 10 properties',
      }),
    ),
    z.object({
      id: z.int().gt(0),
      method: paymentMethodEnumSchema.optional(),
      creditCard: z.string().optional(),
      billingAddress: z.string().optional(),
      labels: z.array(z.string()).optional(),
    }),
  )
  .describe('A payment for a store order')

export type PaymentSchemaType = z.infer<typeof paymentSchema>
