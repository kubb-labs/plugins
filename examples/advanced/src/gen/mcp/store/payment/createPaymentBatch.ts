import type { Payment } from '../../../models/ts/Payment'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { createPaymentBatch } from '../../../clients/axios/paymentService/createPaymentBatch'

/**
 * `POST /store/payments/batch`
 * @summary Pay for several orders at once
 */
export async function createPaymentBatchHandler(
  {
    body,
  }: {
    body?: [Payment, ...string[]]
    path?: never
    query?: never
    headers?: never
  } = {},
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await createPaymentBatch({ body, signal: ctx.mcpReq.signal, throwOnError: true })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
    structuredContent: { data: res.data },
  }
}
