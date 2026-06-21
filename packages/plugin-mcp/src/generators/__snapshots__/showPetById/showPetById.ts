import type { Options, RequestResult } from './.kubb/client'
import type { ShowPetByIdRequestConfig, ShowPetByIdResponses } from './ShowPetById'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets/:petId}
 */
export function showPetById<ThrowOnError extends boolean = true>(
  options: Options<ShowPetByIdRequestConfig, ThrowOnError>,
): Promise<RequestResult<ShowPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pets/{petId}', ...config }) as Promise<RequestResult<ShowPetByIdResponses, ThrowOnError>>
}

/**
 * {@link /pets/:petId}
 */
export async function showPetByIdHandler(
  { path }: ShowPetByIdRequestConfig,
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await showPetById({ path })

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
