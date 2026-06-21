import type { Options, RequestResult } from './.kubb/client'
import type { CreatePetsRequestConfig, CreatePetsResponses } from './CreatePets'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets}
 */
export function createPets<ThrowOnError extends boolean = true>(
  options: Options<CreatePetsRequestConfig, ThrowOnError>,
): Promise<RequestResult<CreatePetsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pets', ...config }) as Promise<RequestResult<CreatePetsResponses, ThrowOnError>>
}

/**
 * {@link /pets}
 */
export async function createPetsHandler(
  { body }: CreatePetsRequestConfig,
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await createPets({ body })

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
