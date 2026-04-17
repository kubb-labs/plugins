import fetch from "@kubb/plugin-client/clients/axios";
import type { UpdatePetWithFormPathPetId, UpdatePetWithFormQueryName, UpdatePetWithFormQueryStatus, UpdatePetWithFormResponse, UpdatePetWithFormStatus405 } from "../../types/UpdatePetWithForm.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithFormHandler({ petId, params }: { petId: UpdatePetWithFormPathPetId; params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus } }): Promise<Promise<CallToolResult>> {




  const res = await fetch<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({ method: "POST", url: `/pet/${petId}`, params })

  return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(res.data)
                }
              ],
              structuredContent: { data: res.data }
             }
}