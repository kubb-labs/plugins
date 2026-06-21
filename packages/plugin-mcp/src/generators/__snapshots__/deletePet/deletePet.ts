import type { Options, RequestResult } from './.kubb/client'
import type { DeletePetRequestConfig, DeletePetResponses } from './DeletePet'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets/:petId}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetRequestConfig, ThrowOnError>,
): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'DELETE', url: '/pets/{petId}', ...config }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
}

/**
 * {@link /pets/:petId}
 */
export async function deletePetHandler(
  { path }: DeletePetRequestConfig,
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await deletePet({ path })

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
