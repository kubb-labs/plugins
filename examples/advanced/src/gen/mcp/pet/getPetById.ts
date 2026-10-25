import type { GetPetByIdOptions } from '../../models/ts/pet/GetPetById'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { getPetById } from '../../clients/axios/petService/getPetById'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export async function getPetByIdHandler({ path }: GetPetByIdOptions, ctx: ServerContext): Promise<CallToolResult> {
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
