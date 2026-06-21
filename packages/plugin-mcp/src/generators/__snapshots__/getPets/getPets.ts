import type { Options, RequestResult } from './.kubb/client'
import type { GetPetsRequestConfig, GetPetsResponses } from './GetPets'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets}
 */
export function getPets<ThrowOnError extends boolean = true>(
  options: Options<GetPetsRequestConfig, ThrowOnError>,
): Promise<RequestResult<GetPetsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pets', ...config }) as Promise<RequestResult<GetPetsResponses, ThrowOnError>>
}

/**
 * {@link /pets}
 */
export async function getPetsHandler(
  { query }: GetPetsRequestConfig = {},
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await getPets({ query })

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
