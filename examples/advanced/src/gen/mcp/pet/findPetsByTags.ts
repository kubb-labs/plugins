import type { FindPetsByTagsXEXAMPLEKey } from '../../models/ts/FindPetsByTagsXEXAMPLE'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { findPetsByTags } from '../../clients/axios/petService/findPetsByTags'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTagsHandler(
  {
    query,
    headers,
  }: {
    body?: never
    path?: never
    query?: {
      tags?: Array<string>
      page?: string
      pageSize?: number
    }
    headers: {
      'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
    }
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await findPetsByTags({ query, headers, signal: ctx.mcpReq.signal, throwOnError: true })

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
