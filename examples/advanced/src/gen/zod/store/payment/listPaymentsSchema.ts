import * as z from 'zod'
import { paymentErrorSchema } from '../../paymentErrorSchema'
import { paymentSchema } from '../../paymentSchema'

export const listPaymentsQueryStatusSchema = z.string().optional()

export type ListPaymentsQueryStatusSchemaType = z.infer<typeof listPaymentsQueryStatusSchema>

export const listPaymentsQueryFilterSchema = z.string().optional()

export type ListPaymentsQueryFilterSchemaType = z.infer<typeof listPaymentsQueryFilterSchema>

export const listPaymentsCookieSessionSchema = z.string().optional()

export type ListPaymentsCookieSessionSchemaType = z.infer<typeof listPaymentsCookieSessionSchema>

export const listPaymentsStatus2xxSchema = z.array(paymentSchema)

export type ListPaymentsStatus2xxSchemaType = z.infer<typeof listPaymentsStatus2xxSchema>

export const listPaymentsStatus4xxSchema = paymentErrorSchema

export type ListPaymentsStatus4xxSchemaType = z.infer<typeof listPaymentsStatus4xxSchema>

export const listPaymentsStatus2xxHeadersSchema = z.object({
  'X-Rate-Limit': z.int().describe('Calls left this hour'),
  'X-Next-Page': z.string().optional(),
})

export type ListPaymentsStatus2xxHeadersSchemaType = z.infer<typeof listPaymentsStatus2xxHeadersSchema>

export const listPaymentsResponseSchema = listPaymentsStatus2xxSchema

export type ListPaymentsResponseSchemaType = z.infer<typeof listPaymentsResponseSchema>

export const listPaymentsErrorSchema = listPaymentsStatus4xxSchema

export type ListPaymentsErrorSchemaType = z.infer<typeof listPaymentsErrorSchema>

export const listPaymentsQuerySchema = z.object({
  status: z.string().optional(),
  filter: z.string().optional(),
})

export type ListPaymentsQuerySchemaType = z.infer<typeof listPaymentsQuerySchema>

export const listPaymentsCookiesSchema = z.object({
  session: z.string().optional(),
})

export type ListPaymentsCookiesSchemaType = z.infer<typeof listPaymentsCookiesSchema>

export const listPaymentsOptionsSchema = z.object({
  body: z.never().optional(),
  path: z.never().optional(),
  query: listPaymentsQuerySchema.optional(),
  headers: z.never().optional(),
  cookies: listPaymentsCookiesSchema.optional(),
})

export type ListPaymentsOptionsSchemaType = z.infer<typeof listPaymentsOptionsSchema>

export const listPaymentsResponsesSchema = z.object({
  '2xx': listPaymentsStatus2xxSchema,
  '4xx': listPaymentsStatus4xxSchema,
})

export type ListPaymentsResponsesSchemaType = z.infer<typeof listPaymentsResponsesSchema>
