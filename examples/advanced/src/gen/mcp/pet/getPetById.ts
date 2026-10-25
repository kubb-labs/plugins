import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { getPetById } from '../../clients/axios/petService/getPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export async function getPetByIdHandler(
  {
    path,
  }: {
    body?: never
    path: {
      petId: number
    }
    query?: never
    headers?: never
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await getPetById({ path, signal: ctx.mcpReq.signal, throwOnError: true })

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
