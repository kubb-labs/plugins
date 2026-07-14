/**
 * Minimal OpenAPI document shape used to resolve security requirements.
 */
export type SecurityDocument = {
  /**
   * Security requirements inherited by operations without an override.
   */
  security?: Array<Record<string, Array<string>>>
  /**
   * Reusable OpenAPI components.
   */
  components?: {
    /**
     * Named security scheme definitions.
     */
    securitySchemes?: Record<string, SecuritySchemeObject | SecuritySchemeReference | undefined>
  }
  /**
   * Operations indexed by their OpenAPI path and method.
   */
  paths?: Record<string, Record<string, { security?: Array<Record<string, Array<string>>> } | undefined> | undefined>
}

type SecuritySchemeReference = {
  $ref: string
}

type SecuritySchemeObject =
  | {
      type: 'http'
      scheme?: string
    }
  | {
      type: 'apiKey'
      name?: string
      in?: string
    }
  | {
      type: 'oauth2'
    }
  | {
      type: 'openIdConnect'
    }

/**
 * Security scheme normalized for generated client credential injection.
 */
export type ResolvedSecurityScheme = {
  /**
   * Scheme name used by OpenAPI security requirements.
   */
  name: string
  /**
   * Credential shape expected by the generated security layer.
   */
  credential: 'apiKey' | 'basic' | 'bearer' | 'authorization'
  /**
   * Request location for an API key.
   */
  in?: 'header' | 'query' | 'cookie'
  /**
   * Wire name for an API key.
   */
  wireName?: string
}

/**
 * One scheme entry inside an OpenAPI security requirement.
 */
export type ResolvedSecurityRequirementEntry = {
  /**
   * Referenced security scheme name.
   */
  name: string
  /**
   * OAuth2 or OpenID Connect scopes required by the operation.
   */
  scopes: Array<string>
}

/**
 * Effective security requirements and schemes for one operation.
 */
export type ResolvedOperationSecurity = {
  /**
   * Ordered OR alternatives whose entries are combined with AND semantics.
   */
  requirements: Array<Array<ResolvedSecurityRequirementEntry>>
  /**
   * Schemes referenced by the alternatives.
   */
  schemes: Array<ResolvedSecurityScheme>
}

function resolveSchemeObject({ document, name }: { document: SecurityDocument; name: string }): SecuritySchemeObject {
  const scheme = document.components?.securitySchemes?.[name]
  if (!scheme) throw new Error(`Security scheme "${name}" is not defined in components.securitySchemes`)
  if (!('$ref' in scheme)) return scheme

  const prefix = '#/components/securitySchemes/'
  if (!scheme.$ref.startsWith(prefix)) throw new Error(`Security scheme "${name}" uses unsupported reference "${scheme.$ref}"`)
  const referencedName = decodeURIComponent(scheme.$ref.slice(prefix.length))
  const referenced = document.components?.securitySchemes?.[referencedName]
  if (!referenced || '$ref' in referenced) throw new Error(`Security scheme "${name}" has an unresolved reference "${scheme.$ref}"`)
  return referenced
}

function resolveScheme({ document, name }: { document: SecurityDocument; name: string }): ResolvedSecurityScheme {
  const scheme = resolveSchemeObject({ document, name })
  if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') return { name, credential: 'bearer' }
  if (scheme.type === 'http') {
    const httpScheme = scheme.scheme?.toLowerCase()
    if (httpScheme === 'basic') return { name, credential: 'basic' }
    if (httpScheme === 'bearer') return { name, credential: 'bearer' }
    return { name, credential: 'authorization' }
  }

  if (!scheme.name) throw new Error(`API key security scheme "${name}" is missing its wire name`)
  if (scheme.in !== 'header' && scheme.in !== 'query' && scheme.in !== 'cookie') {
    throw new Error(`API key security scheme "${name}" has unsupported location "${scheme.in ?? ''}"`)
  }
  return { name, credential: 'apiKey', in: scheme.in, wireName: scheme.name }
}

function credentialSlot(scheme: ResolvedSecurityScheme): string {
  if (scheme.credential !== 'apiKey') return 'header:authorization'
  return `${scheme.in}:${scheme.wireName?.toLowerCase()}`
}

function assertNoRequirementConflicts({
  requirement,
  schemes,
}: {
  requirement: Array<ResolvedSecurityRequirementEntry>
  schemes: Map<string, ResolvedSecurityScheme>
}) {
  const slots = new Map<string, string>()
  for (const entry of requirement) {
    const scheme = schemes.get(entry.name)
    if (!scheme) continue
    const slot = credentialSlot(scheme)
    const previous = slots.get(slot)
    if (previous) throw new Error(`Security requirement cannot combine "${previous}" and "${entry.name}" because both write ${slot}`)
    slots.set(slot, entry.name)
  }
}

/**
 * Resolves OpenAPI global and operation security without flattening OR, AND, or scope information.
 */
export function resolveOperationSecurity({
  document,
  method,
  path,
}: {
  document: SecurityDocument | null | undefined
  method: string
  path: string
}): ResolvedOperationSecurity | null {
  if (!document) return null

  const operation = document.paths?.[path]?.[method.toLowerCase()]
  const requirements = operation && Object.hasOwn(operation, 'security') ? operation.security : document.security
  if (!requirements?.length) return null

  const resolvedRequirements = requirements.map((requirement) => Object.entries(requirement).map(([name, scopes]) => ({ name, scopes: [...scopes] })))
  const schemes = new Map<string, ResolvedSecurityScheme>()
  for (const requirement of resolvedRequirements) {
    for (const entry of requirement) {
      if (!schemes.has(entry.name)) schemes.set(entry.name, resolveScheme({ document, name: entry.name }))
    }
    assertNoRequirementConflicts({ requirement, schemes })
  }

  return { requirements: resolvedRequirements, schemes: [...schemes.values()] }
}
