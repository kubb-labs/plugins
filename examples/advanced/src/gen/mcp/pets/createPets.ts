import type { CreatePetsOptions } from '../../models/ts/pets/CreatePets'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { createPets } from '../../clients/axios/petsService/createPets'

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export async function createPetsHandler({ path, query, body, headers }: CreatePetsOptions, ctx: ServerContext): Promise<CallToolResult> {
  const res = await createPets({ path, query, headers, body, signal: ctx.mcpReq.signal, throwOnError: true })

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
