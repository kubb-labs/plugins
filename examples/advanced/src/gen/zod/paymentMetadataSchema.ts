import * as z from 'zod'

export const paymentMetadataSchema = z.object({
  source: z.string().optional(),
})

export type PaymentMetadataSchemaType = z.infer<typeof paymentMetadataSchema>
