import fetch from "@kubb/plugin-client/clients/axios";
import type { GetUserByNamePathUsername, GetUserByNameResponse, GetUserByNameStatus400, GetUserByNameStatus404 } from "../../types/GetUserByName.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByNameHandler({ username }: { username: GetUserByNamePathUsername }): Promise<Promise<CallToolResult>> {




  const res = await fetch<GetUserByNameResponse, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>, unknown>({ method: "GET", url: `/user/${username}` })

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