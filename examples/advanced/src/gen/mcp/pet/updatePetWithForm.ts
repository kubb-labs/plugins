import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { updatePetWithForm } from '../../clients/axios/petService/updatePetWithForm'

/**
 * `POST /pet/{petId}:search`
 * @summary Updates a pet in the store with form data
 */
export async function updatePetWithFormHandler(
  {
    path,
    query,
  }: {
    body?: never
    path: {
      petId: number
    }
    query?: {
      name?: string
      status?: string
    }
    headers?: never
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await updatePetWithForm({ path, query, signal: ctx.mcpReq.signal, throwOnError: true })

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
