import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { listPayments } from '../../clients/axios/paymentService/listPayments'

/**
 * `GET /store/payments`
 * @summary List payments
 * @see http://swagger.io Payment guide
 */
export async function listPaymentsHandler(
  {
    query,
    cookies,
  }: {
    body?: never
    path?: never
    query?: {
      status?: string
      filter?: string
    }
    headers?: never
    cookies?: {
      session?: string
    }
  } = {},
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await listPayments({ query, cookies, signal: ctx.mcpReq.signal, throwOnError: true })

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
