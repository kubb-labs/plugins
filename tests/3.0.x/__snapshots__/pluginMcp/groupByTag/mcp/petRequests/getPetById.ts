import fetch from "@kubb/plugin-client/clients/axios";
import type { GetPetByIdPathPetId, GetPetByIdResponse, GetPetByIdStatus400, GetPetByIdStatus404 } from "../../types/GetPetById.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetByIdHandler({ petId }: { petId: GetPetByIdPathPetId }): Promise<Promise<CallToolResult>> {




  const res = await fetch<GetPetByIdResponse, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>({ method: "GET", url: `/pet/${petId}` })

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