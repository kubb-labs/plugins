import fetch from "@kubb/plugin-client/clients/axios";
import type { DeleteUserPathUsername, DeleteUserResponse, DeleteUserStatus400, DeleteUserStatus404 } from "../../types/DeleteUser.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult, RequestHandlerExtra } from "@modelcontextprotocol/sdk/types";

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUserHandler({ username }: { username: DeleteUserPathUsername }, request: RequestHandlerExtra): Promise<Promise<CallToolResult>> {




  const res = await fetch<DeleteUserResponse, ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>, unknown>({ method: "DELETE", url: `/user/${username}` }, request)

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