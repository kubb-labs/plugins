/**
 * An OpenAPI server object, read from a path item or an operation.
 */
type Server = {
  url: string
  variables?: Record<string, { default?: string } | undefined>
}

type WithServers = { servers?: Array<Server> }

/**
 * The adapter's `server` option: which entry of a `servers` list to pick, and values for its `{variable}` placeholders.
 */
export type ServerOptions = { index?: number; variables?: Record<string, string> }

/**
 * The slice of an OpenAPI document the base URL derivation reads: the `servers` on each path item and on
 * each operation under it. Typed locally so this package stays independent of the OpenAPI adapter.
 */
export type ServerDocument = {
  paths?: Record<string, (WithServers & Record<string, unknown>) | undefined>
}

/**
 * Returns the base URL of an operation that declares its own `servers`, or of the path item it lives under.
 * The operation's list wins over the path item's. The entry is picked with the adapter's `server.index`,
 * falling back to the first one, and its `{variable}` placeholders are filled from `variables`, then from
 * the spec defaults. Returns `undefined` when neither declares `servers`, so the client's `baseURL` applies.
 *
 * @example
 * `getOperationBaseURL({ document, method: 'GET', path: '/.sse' })`
 * `// 'https://echo.websocket.org'`
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

  return entry?.url.replace(/\{([^{}]+)\}/g, (match, name: string) => variables?.[name] ?? entry.variables?.[name]?.default ?? match)
}
