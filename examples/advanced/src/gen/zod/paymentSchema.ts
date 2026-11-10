import * as z from 'zod'
import { paymentLabelSchema } from './paymentLabelSchema'
import { paymentMetadataSchema } from './paymentMetadataSchema'
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
      z.refine(
        (value) =>
          z
            .object({
              method: z.enum(['card']),
            })
            .safeParse(value).success
            ? typeof value === 'object' && value !== null && ['creditCard'].every((key) => key in value)
            : true,
        { message: 'Value does not meet a conditional schema' },
      ),
      z.refine(
        (value) =>
          typeof value === 'object' && value !== null && ['creditCard'].every((key) => key in value)
            ? typeof value === 'object' && value !== null && ['billingAddress'].every((key) => key in value)
            : true,
        { message: 'Value does not meet a conditional schema' },
      ),
    ),
    z.object({
      id: z.int().gt(0),
      method: paymentMethodEnumSchema.optional(),
      creditCard: z.string().optional(),
      billingAddress: z.string().optional(),
      labels: z
        .array(z.string())
        .refine(
          (items) => {
            const count = items.filter((item) => paymentLabelSchema.safeParse(item).success).length
            return count >= 1 && count <= 2
          },
          { message: 'Array must contain 1 to 2 matching items' },
        )
        .optional(),
      metadata: z
        .string()
        .refine(
          (value) => {
            try {
              return paymentMetadataSchema.safeParse(JSON.parse(value)).success
            } catch {
              return false
            }
          },
          { message: 'Value is not application/json that matches its content schema' },
        )
        .optional(),
      receipt: z.base64().optional(),
    }),
  )
  .describe('A payment for a store order')

export type PaymentSchemaType = z.infer<typeof paymentSchema>
