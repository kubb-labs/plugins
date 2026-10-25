import type { FindPetsByStatusOptions } from '../../models/ts/pet/FindPetsByStatus'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { findPetsByStatus } from '../../clients/axios/petService/findPetsByStatus'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatusHandler({ path }: FindPetsByStatusOptions, ctx: ServerContext): Promise<CallToolResult> {
  const res = await findPetsByStatus({ path, signal: ctx.mcpReq.signal, throwOnError: true })

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
