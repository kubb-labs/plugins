import type { Pet } from '../../models/ts/Pet'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { updatePet } from '../../clients/axios/petService/updatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePetHandler(
  {
    body,
  }: {
    body: Omit<NonNullable<Pet>, 'id'>
    path?: never
    query?: never
    headers?: never
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await updatePet({ body, signal: ctx.mcpReq.signal, throwOnError: true })

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
