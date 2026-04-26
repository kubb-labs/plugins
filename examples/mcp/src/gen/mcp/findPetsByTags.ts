import fetch from "../../client.js";
import type { ResponseErrorConfig } from "../../client.js";
import type { FindPetsByTagsHeaderXEXAMPLE, FindPetsByTagsQueryPage, FindPetsByTagsQueryPageSize, FindPetsByTagsQueryTags, FindPetsByTagsResponse, FindPetsByTagsStatus400 } from "../models/ts/FindPetsByTags.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import type { CallToolResult, ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types";

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTagsHandler({ headers, params }: { headers: { "X-EXAMPLE": FindPetsByTagsHeaderXEXAMPLE }; params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize } }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {




  const res = await fetch<FindPetsByTagsResponse, ResponseErrorConfig<FindPetsByTagsStatus400>, unknown>({ method: "GET", url: `/pet/findByTags`, baseURL: `https://petstore.swagger.io/v2`, params, headers: { ...headers } }, request)

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