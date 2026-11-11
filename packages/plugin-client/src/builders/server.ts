import type { ast } from '@kubb/kit'

/**
 * The adapter's `server` option: which entry of a `servers` list to pick.
 */
export type ServerOptions = { index?: number }

function isAbsoluteURL(url: string): boolean {
  return URL.canParse(url) && url.includes('://') && !url.includes('{')
}

/**
 * Returns the URL of the operation's `servers` (its own, else its path item's), picked with `server.index` and falling back to the
 * first entry. Returns `undefined` without `servers`, for a relative URL such as `/v2`, which would drop the client's host, or for a
 * templated URL, one with `variables`, which is not supported, so the client's `baseURL` applies.
 */
export function getOperationBaseURL({
  servers,
  server: { index = 0 } = {},
}: {
  servers: Array<ast.InputServer> | undefined
  server?: ServerOptions
}): string | undefined {
  const selected = servers?.[index] ?? servers?.[0]

  return selected && !selected.variables && isAbsoluteURL(selected.url) ? selected.url : undefined
}
