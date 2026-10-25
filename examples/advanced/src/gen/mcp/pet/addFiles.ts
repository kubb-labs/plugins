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
  }: Pick<
    | {
        body: {
          url: string
        }
        path?: never
        query?: never
        headers?: never
        contentType?: {
          request: 'application/json'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'multipart/form-data'
        }
      },
    'body'
  >,
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await addFiles({ body, signal: ctx.mcpReq.signal, throwOnError: true } as Parameters<typeof addFiles<true>>[0])

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
