import { isValidVarName, objectKey, stringify, toLiteral } from '@internals/utils'
import { ast } from '@kubb/kit'

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
  flows?: Record<string, Omit<ast.OAuthFlow, 'scopes'>>
  metadataUrl?: string
  url?: string
}

/**
 * One entry of a generated call's `security` array: an OpenAPI security requirement, as one scheme or as the schemes it
 * needs together. The runtime sends the first requirement whose schemes all resolve a token.
 */
export type SecurityRequirement = OperationAuth | Array<OperationAuth>

/**
 * A scheme of one operation. `ref` names its entry in `securitySchemes`, which the call then points at.
 */
type OperationAuth = Auth & { ref?: string }

// The order the keys of an inline scheme are printed in.
const inlineAuthKeys = ['type', 'scheme', 'name', 'in', 'scopes', 'flows', 'metadataUrl', 'url'] as const

function serializeScheme({ ref, ...auth }: OperationAuth): string {
  const scopes = auth.scopes?.length ? auth.scopes : undefined
  if (ref) {
    const schemeRef = isValidVarName(ref) ? `securitySchemes.${ref}` : `securitySchemes[${stringify(ref)}]`
    return scopes ? `{ ...${schemeRef}, scopes: ${toLiteral(scopes)} }` : schemeRef
  }
  const entries = inlineAuthKeys.flatMap((key) => {
    const entryValue = key === 'scopes' ? scopes : auth[key]
    return entryValue ? [`${key}: ${toLiteral(entryValue)}`] : []
  })
  return `{ ${entries.join(', ')} }`
}

function serializeRequirement(requirement: SecurityRequirement): string {
  return Array.isArray(requirement) ? `[${requirement.map(serializeScheme).join(', ')}]` : serializeScheme(requirement)
}

/**
 * Maps an AST credential to the inline `Auth` object, or `null` for `mutualTLS`, which the runtime cannot send.
 * `http` schemes other than `basic` are treated as bearer. OAuth2 and OpenID Connect keep their URLs for the `auth` resolver.
 */
export function resolveCredential(credential: ast.AuthCredential): Auth | null {
  if (credential.type === 'apiKey') return { type: 'apiKey', name: credential.name, in: credential.in }
  if (credential.type === 'http') return { type: 'http', scheme: credential.scheme === 'basic' ? 'basic' : 'bearer' }
  if (credential.type === 'oauth2') {
    const flows = Object.fromEntries(Object.entries(credential.flows).map(([name, { scopes: _scopes, ...urls }]) => [name, urls]))
    return {
      type: 'oauth2',
      ...(Object.keys(flows).length ? { flows } : {}),
      ...(credential.metadataUrl ? { metadataUrl: credential.metadataUrl } : {}),
    }
  }
  if (credential.type === 'openIdConnect') return { type: 'openIdConnect', ...(credential.url ? { url: credential.url } : {}) }
  return null
}

/**
 * Derives the per-operation security metadata from `OperationNode.auth` and the document's `meta.auth` schemes. Each
 * requirement becomes one entry: its scheme, or an array of its schemes when it needs several together. A requirement
 * with a scheme the runtime cannot place or that is not declared is left out, since it can never be met, and so is a
 * repeated one. With `hoist`, each scheme carries its name as `ref`.
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
  hoist,
}: {
  auth: Array<ast.AuthRequirement> | undefined
  schemes: Array<ast.AuthScheme> | undefined
  hoist?: boolean
}): Array<SecurityRequirement> | undefined {
  const security = ast.auth.resolve(auth, schemes).flatMap((requirement): Array<SecurityRequirement> => {
    const resolved = requirement.map(({ name, credential, scopes }) => {
      const entry = resolveCredential(credential)
      return entry && { ...entry, ...(scopes.length ? { scopes } : {}), ...(hoist ? { ref: name } : {}) }
    })
    if (!resolved.length || !resolved.every((entry): entry is OperationAuth => entry !== null)) return []
    return [resolved.length === 1 ? resolved[0]! : resolved]
  })

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

/**
 * The `securitySchemes` const of `.kubb/client.ts`: every scheme the runtime can place, by name, or `null` without one.
 */
export function buildSecuritySchemes(schemes: Array<ast.AuthScheme> | undefined): string | null {
  const entries = (schemes ?? []).flatMap(({ name, credential }) => {
    const auth = resolveCredential(credential)
    return auth ? [`${objectKey(name)}: ${serializeScheme(auth)}`] : []
  })
  if (!entries.length) return null
  return `/**\n * The security schemes from the spec by name. A generated call sends one of them to the \`auth\` resolver.\n */\nexport const securitySchemes = { ${entries.join(', ')} } as const`
}
