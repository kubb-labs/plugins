import type { ast } from '@kubb/kit'

/**
 * A resolved security scheme. The runtime calls the configured `auth` resolver with this object and places the
 * returned token: `http` bearer/basic on `Authorization`, `apiKey` under `name` in the header/query/cookie, and
 * `oauth2`/`openIdConnect` as a bearer token.
 */
export type Auth = {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: 'bearer' | 'basic'
  name?: string
  in?: 'header' | 'query' | 'cookie'
  scopes?: Array<string>
}

/**
 * One entry of a generated call's `security` array: an OpenAPI security requirement, as one scheme or as the schemes it
 * needs together. The runtime sends the first requirement whose schemes all resolve a token.
 */
export type SecurityRequirement = Auth | Array<Auth>

function serializeScheme(auth: Auth): string {
  const parts = [`type: '${auth.type}'`]
  if (auth.scheme) parts.push(`scheme: '${auth.scheme}'`)
  if (auth.name) parts.push(`name: '${auth.name}'`)
  if (auth.in) parts.push(`in: '${auth.in}'`)
  if (auth.scopes?.length) parts.push(`scopes: [${auth.scopes.map((scope) => `'${scope}'`).join(', ')}]`)
  return `{ ${parts.join(', ')} }`
}

function serializeRequirement(requirement: SecurityRequirement): string {
  return Array.isArray(requirement) ? `[${requirement.map(serializeScheme).join(', ')}]` : serializeScheme(requirement)
}

/**
 * Maps an AST credential to the inline `Auth` object, or `null` for `mutualTLS`, which the runtime cannot send.
 * `http` schemes other than `basic` are treated as bearer.
 */
export function resolveCredential(credential: ast.AuthCredential): Auth | null {
  if (credential.type === 'apiKey') return { type: 'apiKey', name: credential.name, in: credential.in }
  if (credential.type === 'http') return { type: 'http', scheme: credential.scheme.toLowerCase() === 'basic' ? 'basic' : 'bearer' }
  if (credential.type === 'oauth2' || credential.type === 'openIdConnect') return { type: credential.type }
  return null
}

/**
 * Derives the per-operation security metadata from `OperationNode.auth` and the document's `meta.auth` schemes. Each
 * requirement becomes one entry: its scheme, or an array of its schemes when it needs several together. A requirement
 * with a scheme the runtime cannot place or that is not declared is left out, since it can never be met, and so is a
 * repeated one.
 *
 * @example
 * `getOperationSecurity({ auth: [[{ scheme: 'bearerAuth' }]], schemes: meta.auth })`
 * `// [{ type: 'http', scheme: 'bearer' }]`
 * @example
 * `// auth: [[{ scheme: 'api_key' }, { scheme: 'session' }]] gives [[{ type: 'apiKey', ... }, { type: 'apiKey', ... }]]`
 */
export function getOperationSecurity({
  auth,
  schemes,
}: {
  auth: Array<ast.AuthRequirement> | undefined
  schemes: Array<ast.AuthScheme> | undefined
}): Array<SecurityRequirement> | undefined {
  if (!auth?.length) return undefined

  const credentials = new Map(schemes?.map((scheme) => [scheme.name, scheme.credential]))
  const security: Array<SecurityRequirement> = []
  const seen = new Set<string>()
  for (const requirement of auth) {
    const key = requirement.map(({ scheme }) => scheme).join('\0')
    if (!requirement.length || seen.has(key)) continue
    seen.add(key)
    const resolved: Array<Auth> = []
    for (const { scheme, scopes } of requirement) {
      const credential = credentials.get(scheme)
      const entry = credential ? resolveCredential(credential) : null
      if (!entry) break
      resolved.push(scopes?.length ? { ...entry, scopes } : entry)
    }
    if (resolved.length !== requirement.length) continue
    security.push(resolved.length === 1 ? resolved[0]! : resolved)
  }

  return security.length ? security : undefined
}

/**
 * Serializes the per-operation security into the literal emitted on each generated call's `security`
 * field. The runtime `resolveAuth` helper walks it, calling the configured `auth` resolver per scheme.
 *
 * @example
 * `buildSecurityMetadata({ security: [{ type: 'http', scheme: 'bearer' }] }) // "[{ type: 'http', scheme: 'bearer' }]"`
 */
export function buildSecurityMetadata({ security }: { security?: Array<SecurityRequirement> }): string | null {
  if (!security?.length) return null
  return `[${security.map(serializeRequirement).join(', ')}]`
}
