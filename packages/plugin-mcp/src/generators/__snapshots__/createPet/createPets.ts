import type { ResponseErrorConfig } from './.kubb/fetch'
import type { CreatePetsData, CreatePetsResponse } from './CreatePets'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { fetch } from './.kubb/fetch'

/**
 * {@link /pets}
 */
export async function createPetsHandler(
  { data }: { data?: CreatePetsData } = {},
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreatePetsResponse, ResponseErrorConfig<Error>, CreatePetsData>({ method: 'POST', url: `/pets`, data: requestData }, request)

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
