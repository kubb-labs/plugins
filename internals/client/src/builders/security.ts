/**
 * A resolved security scheme as emitted on each generated call's `security` array. The runtime calls
 * the configured `auth` resolver with this object and places the returned token: `http` bearer/basic
 * on `Authorization`, `apiKey` under `name` in the header/query/cookie, and `oauth2`/`openIdConnect`
 * as a bearer token.
 */
export type Auth = {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: 'bearer' | 'basic'
  name?: string
  in?: 'header' | 'query' | 'cookie'
}

/**
 * A single OpenAPI security requirement read from the spec: scheme name to the scopes it needs.
 */
type SecurityRequirement = Record<string, Array<string>>

/**
 * The slice of an OpenAPI document the security derivation reads: the global `security`, the
 * per-operation `security` under `paths`, and the `securitySchemes` map under `components`. Typed
 * locally so this package stays independent of the OpenAPI adapter.
 */
export type SecurityDocument = {
  security?: Array<SecurityRequirement>
  components?: {
    securitySchemes?: Record<string, OasSecurityScheme | { $ref: string } | undefined>
  }
  paths?: Record<string, Record<string, { security?: Array<SecurityRequirement> } | undefined> | undefined>
}

type OasSecurityScheme = { type: 'http'; scheme?: string } | { type: 'apiKey'; name?: string; in?: string } | { type: 'oauth2' } | { type: 'openIdConnect' }

function serializeAuth(auth: Auth): string {
  const parts = [`type: '${auth.type}'`]
  if (auth.scheme) parts.push(`scheme: '${auth.scheme}'`)
  if (auth.name) parts.push(`name: '${auth.name}'`)
  if (auth.in) parts.push(`in: '${auth.in}'`)
  return `{ ${parts.join(', ')} }`
}

/**
 * Maps an OpenAPI security scheme to the inline `Auth` object, or `null` when the runtime cannot
 * place it (an unresolved `$ref`, or an `apiKey` without a name or outside `header` / `query` /
 * `cookie`). `http` schemes other than `basic` are treated as bearer.
 */
export function resolveSecurityScheme(scheme: OasSecurityScheme | { $ref: string } | undefined): Auth | null {
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
 * `security` overrides the global `security` (an explicit empty array disables auth), and every
 * referenced scheme is resolved from `components.securitySchemes` into a flat, de-duplicated list of
 * `Auth` objects the runtime walks in order.
 *
 * @example
 * `getOperationSecurity({ document, method: 'POST', path: '/pet' })`
 * `// [{ type: 'http', scheme: 'bearer' }]`
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
    for (const schemeName of Object.keys(requirement)) {
      if (seen.has(schemeName)) continue
      seen.add(schemeName)
      const auth = resolveSecurityScheme(definitions[schemeName])
      if (auth) security.push(auth)
    }
  }

  return security.length ? security : undefined
}

/**
 * Serializes the per-operation security into the literal emitted on each generated call's `security`
 * field. The runtime `resolveAuth` helper walks it, calling the configured `auth` resolver per entry.
 *
 * @example
 * `buildSecurityMetadata({ security: [{ type: 'http', scheme: 'bearer' }] }) // "[{ type: 'http', scheme: 'bearer' }]"`
 */
export function buildSecurityMetadata({ security }: { security?: Array<Auth> }): string | null {
  if (!security?.length) return null
  return `[${security.map(serializeAuth).join(', ')}]`
}
