import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type {
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormResponse,
  UpdatePetWithFormStatus405,
} from '../models/ts/UpdatePetWithForm.js'

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithFormHandler({
  petId,
  params,
}: {
  petId: UpdatePetWithFormPathPetId
  params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus }
}): Promise<Promise<CallToolResult>> {
  const res = await fetch<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({
    method: 'POST',
    url: `/pet/${petId}`,
    baseURL: 'https://petstore.swagger.io/v2',
    params,
  })

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
