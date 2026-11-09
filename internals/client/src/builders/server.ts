type Server = { url: string; variables?: Record<string, { default?: string } | undefined> }
type WithServers = { servers?: Array<Server> }

/** The adapter's `server` option: the `servers` entry to pick and values for its `{variable}` placeholders. */
export type ServerOptions = { index?: number; variables?: Record<string, string> }

/** The `servers` on each path item and operation, typed locally so this package stays independent of the OpenAPI adapter. */
export type ServerDocument = { paths?: Record<string, (WithServers & Record<string, unknown>) | undefined> }

/**
 * Returns the URL of the operation's own `servers`, else its path item's, picked with `server.index` and falling back to the
 * first entry. `{variable}` placeholders are filled from `server.variables`, then the spec defaults. Returns `undefined` without
 * `servers` or for a relative URL such as `/v2`, which would drop the client's host, so the client's `baseURL` applies.
 */
export function getOperationBaseURL({
  document,
  method,
  path,
  server: { index = 0, variables } = {},
}: {
  document: ServerDocument | null | undefined
  method: string
  path: string
  server?: ServerOptions
}): string | undefined {
  const pathItem = document?.paths?.[path]
  const operation = pathItem?.[method.toLowerCase()] as WithServers | undefined
  const servers = [operation?.servers, pathItem?.servers].find((list) => list?.length)
  const entry = servers?.[index] ?? servers?.[0]

  const url = entry?.url.replace(/\{([^{}]+)\}/g, (match, name: string) => variables?.[name] ?? entry.variables?.[name]?.default ?? match)

  return url && /^[a-z][a-z\d+.-]*:\/\//i.test(url) ? url : undefined
}
