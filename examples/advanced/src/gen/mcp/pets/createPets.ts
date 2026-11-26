import type { CreatePetsXEXAMPLEEnumKey } from '../../models/ts/CreatePetsXEXAMPLEEnum'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { createPets } from '../../clients/axios/petsService/createPets'

/**
 * `POST /pets/{uuid}`
 * @summary Create a pet
 */
export async function createPetsHandler(
  {
    path,
    query,
    body,
    headers,
  }: {
    body: {
      name: string
      tag: string
    }
    path: {
      uuid: string
    }
    query?: {
      bool_param?: true
      offset?: number
    }
    headers: {
      'X-EXAMPLE': CreatePetsXEXAMPLEEnumKey
    }
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await createPets({ path, query, body, headers, signal: ctx.mcpReq.signal, throwOnError: true })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data) ?? '',
      },
    ],
    structuredContent: { data: res.data },
  }
}
