import type { AddPetRequest } from '../../models/ts/AddPetRequest'
import type { Pet } from '../../models/ts/Pet'
import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { addPet } from '../../clients/axios/petService/addPet'

/**
 * `POST /pet`
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 */
export async function addPetHandler(
  {
    body,
  }: Pick<
    | {
        body: AddPetRequest
        path?: never
        query?: never
        headers?: never
        contentType?:
          | 'application/json'
          | {
              request: 'application/json'
            }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'application/xml'
          | {
              request: 'application/xml'
            }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'application/x-www-form-urlencoded'
          | {
              request: 'application/x-www-form-urlencoded'
            }
      },
    'body'
  >,
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await addPet({ body, signal: ctx.mcpReq.signal, throwOnError: true } as Parameters<typeof addPet<true>>[0])

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
