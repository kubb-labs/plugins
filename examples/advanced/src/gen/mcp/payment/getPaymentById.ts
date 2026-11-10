import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { getPaymentById } from '../../clients/axios/paymentService/getPaymentById'

/**
 * `GET /store/payments/{paymentId}`
 * @summary Find a payment by ID
 */
export async function getPaymentByIdHandler(
  {
    path,
  }: {
    body?: never
    path: {
      paymentId: number
    }
    query?: never
    headers?: never
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await getPaymentById({ path, signal: ctx.mcpReq.signal, throwOnError: true })

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
