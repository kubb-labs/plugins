import type { UpdatePetOptions } from '../../models/ts/pet/UpdatePet'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { updatePet } from '../../clients/axios/petService/updatePet'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePetHandler(
  { body }: UpdatePetOptions,
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await updatePet({ body })

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
