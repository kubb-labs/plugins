import type { Payment } from '../../models/ts/Payment'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { createPayment } from '../../clients/axios/paymentService/createPayment'

/**
 * `POST /store/payments`
 * @summary Pay for an order
 */
export async function createPaymentHandler(
  {
    body,
  }: {
    body: Payment
    path?: never
    query?: never
    headers?: never
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await createPayment({ body, signal: ctx.mcpReq.signal, throwOnError: true })

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
