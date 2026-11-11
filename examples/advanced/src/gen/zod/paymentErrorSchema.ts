import * as z from 'zod'

export const paymentErrorSchema = z.object({
  message: z.string(),
})

export type PaymentErrorSchemaType = z.infer<typeof paymentErrorSchema>
