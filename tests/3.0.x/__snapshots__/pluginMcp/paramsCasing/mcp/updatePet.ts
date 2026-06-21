import type { Options, RequestResult } from '../.kubb/client.ts'
import type { UpdatePetRequestConfig, UpdatePetResponses } from '../types/UpdatePet.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * {@link /pets/:pet_id}
 */
export function updatePet<ThrowOnError extends boolean = true>(options: Options<UpdatePetRequestConfig, ThrowOnError>): Promise<RequestResult<UpdatePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pets/{pet_id}', ...config }) as Promise<RequestResult<UpdatePetResponses, ThrowOnError>>
}

/**
 * {@link /pets/:pet_id}
 */
export async function updatePetHandler({ path, query, body }: UpdatePetRequestConfig, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await updatePet({ path, query, body })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data)
      }
    ],
    structuredContent: { data: res.data }
  }
}