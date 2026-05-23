import client from '@kubb/plugin-client/clients/axios'
import type {
  FindPetsByTagsHeaderXEXAMPLE,
  FindPetsByTagsQueryPage,
  FindPetsByTagsQueryPageSize,
  FindPetsByTagsQueryTags,
  FindPetsByTagsResponse,
  FindPetsByTagsStatus400,
} from '../../models/ts/petController/FindPetsByTags.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTagsHandler(
  {
    headers,
    params,
  }: {
    headers: { xEXAMPLE: FindPetsByTagsHeaderXEXAMPLE }
    params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize }
  },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const res = await client<FindPetsByTagsResponse, ResponseErrorConfig<FindPetsByTagsStatus400>, unknown>(
    { method: 'GET', url: `/pet/findByTags`, baseURL: `https://petstore.swagger.io/v2`, params, headers: { ...mappedHeaders } },
    request,
  )

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
