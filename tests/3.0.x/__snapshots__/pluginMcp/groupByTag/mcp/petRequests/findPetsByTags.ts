import fetch from "@kubb/plugin-client/clients/axios";
import type { FindPetsByTagsQueryTags, FindPetsByTagsResponse, FindPetsByTagsStatus400 } from "../../types/FindPetsByTags.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTagsHandler({ params }: { params?: { tags?: FindPetsByTagsQueryTags } } = {}): Promise<Promise<CallToolResult>> {




  const res = await fetch<FindPetsByTagsResponse, ResponseErrorConfig<FindPetsByTagsStatus400>, unknown>({ method: "GET", url: `/pet/findByTags`, params })

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