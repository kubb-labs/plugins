import * as z from 'zod'
import { paymentSchema } from '../../paymentSchema'

export const createPaymentBatchStatus204Schema = z.unknown()

export type CreatePaymentBatchStatus204SchemaType = z.infer<typeof createPaymentBatchStatus204Schema>

export const createPaymentBatchResponseSchema = createPaymentBatchStatus204Schema

export type CreatePaymentBatchResponseSchemaType = z.infer<typeof createPaymentBatchResponseSchema>

export const createPaymentBatchBodySchema = z.tuple([paymentSchema], z.string()).optional()

export type CreatePaymentBatchBodySchemaType = z.infer<typeof createPaymentBatchBodySchema>

export const createPaymentBatchOptionsSchema = z.object({
  body: createPaymentBatchBodySchema.optional(),
  path: z.never().optional(),
  query: z.never().optional(),
  headers: z.never().optional(),
})

export type CreatePaymentBatchOptionsSchemaType = z.infer<typeof createPaymentBatchOptionsSchema>

export const createPaymentBatchResponsesSchema = z.object({
  '204': createPaymentBatchStatus204Schema,
})

export type CreatePaymentBatchResponsesSchemaType = z.infer<typeof createPaymentBatchResponsesSchema>
