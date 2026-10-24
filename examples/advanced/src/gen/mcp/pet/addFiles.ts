import type { Pet } from '../../models/ts/Pet'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { addFiles } from '../../clients/axios/petService/addFiles'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFilesHandler(
  {
    body,
  }: {
    body:
      | {
          url: string
        }
      | Omit<NonNullable<Pet>, 'id'>
    path?: never
    query?: never
    headers?: never
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await addFiles({ body, signal: ctx.mcpReq.signal, throwOnError: true })

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
