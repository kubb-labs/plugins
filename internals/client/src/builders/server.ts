type Server = { url?: string }
type WithServers = { servers?: Array<Server> }

/** The adapter's `server` option: which entry of a `servers` list to pick. */
export type ServerOptions = { index?: number }

/** The `servers` on each path item and operation, typed locally so this package stays independent of the OpenAPI adapter. */
export type ServerDocument = { paths?: Record<string, (WithServers & Record<string, unknown>) | undefined> }

/**
 * Returns the URL of the operation's own `servers`, else its path item's, picked with `server.index` and falling back to the
 * first entry. Returns `undefined` without `servers`, for a relative URL such as `/v2`, which would drop the client's host, or
 * for a URL with `{variable}` placeholders, which are not supported, so the client's `baseURL` applies.
 */
export function getOperationBaseURL({
  document,
  method,
  path,
  server: { index = 0 } = {},
}: {
  document: ServerDocument | null | undefined
  method: string
  path: string
  server?: ServerOptions
}): string | undefined {
  const pathItem = document?.paths?.[path]
  const operation = pathItem?.[method.toLowerCase()] as WithServers | undefined
  const servers = [operation?.servers, pathItem?.servers].find((list) => list?.length)
  const url = (servers?.[index] ?? servers?.[0])?.url

  return url && /^[a-z][a-z\d+.-]*:\/\/[^{}]*$/i.test(url) ? url : undefined
}
