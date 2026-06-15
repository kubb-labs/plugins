/**
 * A single OpenAPI security requirement: scheme name to the scopes it needs.
 */
export type SecurityRequirement = Record<string, Array<string>>

const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function serializeRequirement(requirement: SecurityRequirement): string {
  const entries = Object.entries(requirement).map(([scheme, scopes]) => {
    const key = identifierPattern.test(scheme) ? scheme : `'${scheme}'`
    return `${key}: [${scopes.map((scope) => `'${scope}'`).join(', ')}]`
  })
  return `{ ${entries.join(', ')} }`
}

/**
 * Serializes per-operation security requirements into the literal emitted on each generated call's
 * `security` field. The runtime `resolveAuth` helper consumes it (full wiring lands with #395), so
 * the requirements come in as a parameter rather than being read off the operation node here.
 *
 * @example
 * `buildSecurityMetadata({ security: [{ bearerAuth: [] }] }) // "[{ bearerAuth: [] }]"`
 */
export function buildSecurityMetadata({ security }: { security?: Array<SecurityRequirement> }): string | null {
  if (!security?.length) return null
  return `[${security.map(serializeRequirement).join(', ')}]`
}
