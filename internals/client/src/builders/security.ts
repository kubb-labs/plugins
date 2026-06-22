/**
 * A single OpenAPI security requirement: scheme name to the scopes it needs.
 */
export type SecurityRequirement = Record<string, Array<string>>

/**
 * A resolved security scheme, narrowed to the kinds the runtime can place on a request. `oauth2` and
 * `openIdConnect` collapse to bearer, matching the runtime `resolveAuth` mapping.
 */
export type SecurityScheme = { type: 'http'; scheme: 'bearer' } | { type: 'http'; scheme: 'basic' } | { type: 'apiKey'; name: string; in: 'header' | 'query' }

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

const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function quoteKey(name: string): string {
  return identifierPattern.test(name) ? name : `'${name}'`
}

function serializeRequirement(requirement: SecurityRequirement): string {
  const entries = Object.entries(requirement).map(([scheme, scopes]) => `${quoteKey(scheme)}: [${scopes.map((scope) => `'${scope}'`).join(', ')}]`)
  return `{ ${entries.join(', ')} }`
}

function serializeScheme(scheme: SecurityScheme): string {
  if (scheme.type === 'apiKey') return `{ type: 'apiKey', name: '${scheme.name}', in: '${scheme.in}' }`
  return `{ type: 'http', scheme: '${scheme.scheme}' }`
}

/**
 * Maps an OpenAPI security scheme to the runtime `SecurityScheme`, or `null` when the runtime cannot
 * place it (an unresolved `$ref`, or an `apiKey` outside `header` / `query`). `oauth2` and
 * `openIdConnect` reduce to bearer, as do `http` schemes other than `basic`.
 */
export function resolveSecurityScheme(scheme: OasSecurityScheme | { $ref: string } | undefined): SecurityScheme | null {
  if (!scheme || '$ref' in scheme) return null
  if (scheme.type === 'apiKey') {
    if (!scheme.name || (scheme.in !== 'header' && scheme.in !== 'query')) return null
    return { type: 'apiKey', name: scheme.name, in: scheme.in }
  }
  if (scheme.type === 'http' && scheme.scheme?.toLowerCase() === 'basic') return { type: 'http', scheme: 'basic' }
  return { type: 'http', scheme: 'bearer' }
}

/**
 * Derives the per-operation security metadata from the OpenAPI document. The operation's own
 * `security` overrides the global `security` (an explicit empty array disables auth), and every
 * referenced scheme is resolved from `components.securitySchemes` into the runtime `schemes` map.
 *
 * @example
 * `getOperationSecurity({ document, method: 'POST', path: '/pet' })`
 * `// { security: [{ petstore_auth: ['write:pets'] }], schemes: { petstore_auth: { type: 'http', scheme: 'bearer' } } }`
 */
export function getOperationSecurity({ document, method, path }: { document: SecurityDocument | null | undefined; method: string; path: string }): {
  security?: Array<SecurityRequirement>
  schemes: Record<string, SecurityScheme>
} {
  if (!document) return { schemes: {} }

  const operation = document.paths?.[path]?.[method.toLowerCase()]
  const requirements = operation?.security ?? document.security
  if (!requirements?.length) return { schemes: {} }

  const definitions = document.components?.securitySchemes ?? {}
  const schemes: Record<string, SecurityScheme> = {}
  for (const requirement of requirements) {
    for (const schemeName of Object.keys(requirement)) {
      if (schemes[schemeName]) continue
      const resolved = resolveSecurityScheme(definitions[schemeName])
      if (resolved) schemes[schemeName] = resolved
    }
  }

  return { security: requirements, schemes }
}

/**
 * Serializes per-operation security requirements into the literal emitted on each generated call's
 * `security` field. The runtime `resolveAuth` helper consumes it together with the `schemes` map.
 *
 * @example
 * `buildSecurityMetadata({ security: [{ bearerAuth: [] }] }) // "[{ bearerAuth: [] }]"`
 */
export function buildSecurityMetadata({ security }: { security?: Array<SecurityRequirement> }): string | null {
  if (!security?.length) return null
  return `[${security.map(serializeRequirement).join(', ')}]`
}

/**
 * Serializes the resolved security schemes into the literal emitted on the generated call's
 * `schemes` field, telling the runtime how to place each scheme's credential.
 *
 * @example
 * `buildSchemesMetadata({ schemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } })`
 * `// "{ bearerAuth: { type: 'http', scheme: 'bearer' } }"`
 */
export function buildSchemesMetadata({ schemes }: { schemes?: Record<string, SecurityScheme> }): string | null {
  if (!schemes) return null
  const entries = Object.entries(schemes).map(([name, scheme]) => `${quoteKey(name)}: ${serializeScheme(scheme)}`)
  if (!entries.length) return null
  return `{ ${entries.join(', ')} }`
}
