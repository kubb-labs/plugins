import type { CreatePetsData } from './CreatePets'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets}
 */
export async function createPetsHandler(
  { data }: { data?: CreatePetsData } = {},
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const requestBody = data

  const res = await client({ method: 'POST', url: `/pets`, body: requestBody })

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
