/**
 * A resolved security scheme. The runtime calls the configured `auth` resolver with this object and places the
 * returned token: `http` bearer/basic on `Authorization`, `apiKey` under `name` in the header/query/cookie, and
 * `oauth2`/`openIdConnect` as a bearer token.
 */
export type AuthScheme = {
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
export type Auth = AuthScheme | Array<AuthScheme>

/**
 * A single OpenAPI security requirement read from the spec: scheme name to the scopes it needs.
 */
type OasSecurityRequirement = Record<string, Array<string>>

/**
 * The slice of an OpenAPI document the security derivation reads: the global `security`, the
 * per-operation `security` under `paths`, and the `securitySchemes` map under `components`. Typed
 * locally so this package stays independent of the OpenAPI adapter.
 */
export type SecurityDocument = {
  security?: Array<OasSecurityRequirement>
  components?: {
    securitySchemes?: Record<string, OasSecurityScheme | { $ref: string } | undefined>
  }
  paths?: Record<string, Record<string, { security?: Array<OasSecurityRequirement> } | undefined> | undefined>
}

type OasSecurityScheme = { type: 'http'; scheme?: string } | { type: 'apiKey'; name?: string; in?: string } | { type: 'oauth2' } | { type: 'openIdConnect' }

function serializeScheme(auth: AuthScheme): string {
  const parts = [`type: '${auth.type}'`]
  if (auth.scheme) parts.push(`scheme: '${auth.scheme}'`)
  if (auth.name) parts.push(`name: '${auth.name}'`)
  if (auth.in) parts.push(`in: '${auth.in}'`)
  if (auth.scopes?.length) parts.push(`scopes: [${auth.scopes.map((scope) => `'${scope}'`).join(', ')}]`)
  return `{ ${parts.join(', ')} }`
}

function serializeAuth(auth: Auth): string {
  return Array.isArray(auth) ? `[${auth.map(serializeScheme).join(', ')}]` : serializeScheme(auth)
}

/**
 * Maps an OpenAPI security scheme to the inline `Auth` object, or `null` when the runtime cannot
 * place it (an unresolved `$ref`, or an `apiKey` without a name or outside `header` / `query` /
 * `cookie`). `http` schemes other than `basic` are treated as bearer.
 */
export function resolveSecurityScheme(scheme: OasSecurityScheme | { $ref: string } | undefined): AuthScheme | null {
  if (!scheme || '$ref' in scheme) return null
  if (scheme.type === 'apiKey') {
    if (!scheme.name || (scheme.in !== 'header' && scheme.in !== 'query' && scheme.in !== 'cookie')) return null
    return { type: 'apiKey', name: scheme.name, in: scheme.in }
  }
  if (scheme.type === 'http') return { type: 'http', scheme: scheme.scheme?.toLowerCase() === 'basic' ? 'basic' : 'bearer' }
  if (scheme.type === 'oauth2') return { type: 'oauth2' }
  if (scheme.type === 'openIdConnect') return { type: 'openIdConnect' }
  return null
}

/**
 * Derives the per-operation security metadata from the OpenAPI document. The operation's own
 * `security` overrides the global `security` (an explicit empty array disables auth). Each requirement becomes one
 * entry: its scheme, or an array of its schemes when it needs several together. A requirement with a scheme the runtime
 * cannot place is left out, since it can never be met, and so is a repeated one.
 *
 * @example
 * `getOperationSecurity({ document, method: 'POST', path: '/pet' })`
 * `// [{ type: 'http', scheme: 'bearer' }]`
 * @example
 * `// security: [{ api_key: [], session: [] }] gives [[{ type: 'apiKey', ... }, { type: 'apiKey', ... }]]`
 */
export function getOperationSecurity({
  document,
  method,
  path,
}: {
  document: SecurityDocument | null | undefined
  method: string
  path: string
}): Array<Auth> | undefined {
  if (!document) return undefined

  const operation = document.paths?.[path]?.[method.toLowerCase()]
  const requirements = operation?.security ?? document.security
  if (!requirements?.length) return undefined

  const definitions = document.components?.securitySchemes ?? {}
  const security: Array<Auth> = []
  const seen = new Set<string>()
  for (const requirement of requirements) {
    const entries = Object.entries(requirement)
    const key = entries.map(([schemeName]) => schemeName).join('\0')
    if (!entries.length || seen.has(key)) continue
    seen.add(key)
    const schemes = entries.map(([schemeName, scopes]) => {
      const auth = resolveSecurityScheme(definitions[schemeName])
      return auth && scopes.length ? { ...auth, scopes } : auth
    })
    if (schemes.some((scheme) => scheme === null)) continue
    const resolved = schemes.filter((scheme): scheme is AuthScheme => scheme !== null)
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
export function buildSecurityMetadata({ security }: { security?: Array<Auth> }): string | null {
  if (!security?.length) return null
  return `[${security.map(serializeAuth).join(', ')}]`
}
