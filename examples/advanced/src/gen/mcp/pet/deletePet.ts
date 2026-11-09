import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { deletePet } from '../../clients/axios/petService/deletePet'

/**
 * `DELETE /pet/{petId}:search`
 * @description delete a pet
 * @summary Deletes a pet
 */
export async function deletePetHandler(
  {
    path,
    headers,
  }: {
    body?: never
    path: {
      petId: number
    }
    query?: never
    headers?: {
      api_key?: string
    }
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await deletePet({ path, headers, signal: ctx.mcpReq.signal, throwOnError: true })

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
