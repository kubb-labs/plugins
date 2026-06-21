import type { Options, RequestResult } from '../.kubb/client.ts'
import type { FindPetsByStatusRequestConfig, FindPetsByStatusResponses } from '../types/FindPetsByStatus.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export function findPetsByStatus<ThrowOnError extends boolean = true>(options: Options<FindPetsByStatusRequestConfig, ThrowOnError>): Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/findByStatus', ...config }) as Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>>
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatusHandler({ query }: FindPetsByStatusRequestConfig = {}, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await findPetsByStatus({ query })

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