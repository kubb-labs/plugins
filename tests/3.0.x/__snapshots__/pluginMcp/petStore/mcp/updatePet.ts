import fetch from "@kubb/plugin-client/clients/axios";
import type { UpdatePetData, UpdatePetResponse, UpdatePetStatus400, UpdatePetStatus404, UpdatePetStatus405 } from "../types/UpdatePet.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePetHandler({ data }: { data: UpdatePetData }): Promise<Promise<CallToolResult>> {


  const requestData = data


  const res = await fetch<UpdatePetResponse, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, UpdatePetData>({ method: "PUT", url: `/pet`, data: requestData })

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