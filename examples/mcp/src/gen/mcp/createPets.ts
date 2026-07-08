import type { CreatePetsOptions } from '../models/ts/CreatePets.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { createPets } from '../clients/createPets.js'

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export async function createPetsHandler(
  { path, query, body, headers }: CreatePetsOptions,
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await createPets({ path, query, headers, body })

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
