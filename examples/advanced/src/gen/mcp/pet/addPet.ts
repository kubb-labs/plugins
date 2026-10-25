import type { AddPetOptions } from '../../models/ts/pet/AddPet'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { addPet } from '../../clients/axios/petService/addPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPetHandler({ body }: AddPetOptions, ctx: ServerContext): Promise<CallToolResult> {
  const res = await addPet({ body, signal: ctx.mcpReq.signal, throwOnError: true })

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
