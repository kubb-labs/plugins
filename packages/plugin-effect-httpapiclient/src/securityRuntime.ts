import type { ResolvedSecurityScheme, ResolvedSecurityRequirementEntry } from './security.ts'

/**
 * Security metadata embedded in the generated client middleware.
 */
export type SecurityOperation = {
  /**
   * Generated HttpApi endpoint identifier.
   */
  identifier: string
  /**
   * Ordered OpenAPI security alternatives.
   */
  requirements: Array<Array<ResolvedSecurityRequirementEntry>>
}

function credentialType(scheme: ResolvedSecurityScheme): string {
  if (scheme.credential === 'basic') return 'BasicCredential'
  if (scheme.credential === 'bearer') return 'BearerCredential'
  if (scheme.credential === 'authorization') return 'AuthorizationCredential'
  return 'ApiKeyCredential'
}

/**
 * Renders the generated client-only security middleware and credential Layer.
 */
export function renderSecurityRuntime({ operations, schemes }: { operations: Array<SecurityOperation>; schemes: Array<ResolvedSecurityScheme> }): string {
  const schemeNames = schemes.map((scheme) => JSON.stringify(scheme.name)).join(' | ') || 'never'
  const credentialFields = schemes.map((scheme) => `  readonly ${JSON.stringify(scheme.name)}?: ${credentialType(scheme)}`).join('\n')
  const schemeEntries = schemes
    .map(
      (scheme) =>
        `  ${JSON.stringify(scheme.name)}: ${JSON.stringify({
          credential: scheme.credential,
          in: scheme.in,
          wireName: scheme.wireName,
        })},`,
    )
    .join('\n')
  const requirementEntries = operations.map((operation) => `  ${JSON.stringify(operation.identifier)}: ${JSON.stringify(operation.requirements)},`).join('\n')

  return `
type SecurityScheme =
  | {
      readonly credential: 'apiKey'
      readonly in: 'header' | 'query' | 'cookie'
      readonly wireName: string
    }
  | {
      readonly credential: 'basic' | 'bearer' | 'authorization'
    }

type SecurityRequirementEntry = {
  readonly name: SecuritySchemeName
  readonly scopes: ReadonlyArray<string>
}

type ResolvedCredential = {
  readonly scheme: SecurityScheme
  readonly credential: SecurityCredential
}

/**
 * Names declared under OpenAPI components.securitySchemes and used by this client.
 */
export type SecuritySchemeName = ${schemeNames}

/**
 * Credential supplied for an OpenAPI API key scheme.
 */
export type ApiKeyCredential = {
  readonly _tag: 'ApiKey'
  readonly value: Redacted.Redacted
}

/**
 * Credential supplied for HTTP Basic authentication.
 */
export type BasicCredential = {
  readonly _tag: 'Basic'
  readonly username: string | Redacted.Redacted
  readonly password: Redacted.Redacted
}

/**
 * Credential supplied for bearer, OAuth2, or OpenID Connect authentication.
 */
export type BearerCredential = {
  readonly _tag: 'Bearer'
  readonly token: Redacted.Redacted
}

/**
 * Complete Authorization header value supplied for another HTTP authentication scheme.
 */
export type AuthorizationCredential = {
  readonly _tag: 'Authorization'
  readonly value: Redacted.Redacted
}

/**
 * Credential accepted by the generated security resolver.
 */
export type SecurityCredential = ApiKeyCredential | BasicCredential | BearerCredential | AuthorizationCredential

/**
 * Static credentials keyed by their original OpenAPI security scheme names.
 */
export type SecurityCredentials = {
${credentialFields}
}

/**
 * Context passed to a dynamic credential resolver for each required scheme.
 */
export type SecurityCredentialRequest = {
  readonly endpoint: string
  readonly scheme: SecuritySchemeName
  readonly scopes: ReadonlyArray<string>
}

/**
 * Resolves a credential at request time, which supports token refresh and scoped credentials.
 */
export type SecurityCredentialResolver<E, R> = (
  request: SecurityCredentialRequest,
) => Effect.Effect<SecurityCredential | undefined, E, R>

/**
 * Options for the generated security client Layer.
 */
export type SecurityLayerOptions<E, R> = {
  /**
   * Static credentials checked before the dynamic resolver.
   */
  readonly credentials?: SecurityCredentials
  /**
   * Dynamic fallback used when a static credential is absent.
   */
  readonly resolve?: SecurityCredentialResolver<E, R>
}

/**
 * Indicates that no complete OpenAPI security alternative could be satisfied.
 */
export class MissingSecurityCredentials extends Data.TaggedError('MissingSecurityCredentials')<{
  readonly endpoint: string
  readonly requirements: ReadonlyArray<ReadonlyArray<SecuritySchemeName>>
}> {}

/**
 * Wraps a failure raised by the dynamic credential resolver.
 */
export class SecurityCredentialResolutionError extends Data.TaggedError('SecurityCredentialResolutionError')<{
  readonly endpoint: string
  readonly scheme: SecuritySchemeName
  readonly cause: unknown
}> {}

/**
 * Client middleware marker attached to secured endpoints.
 */
export class ApiSecurity extends HttpApiMiddleware.Service<
  ApiSecurity,
  { clientError: MissingSecurityCredentials | SecurityCredentialResolutionError }
>()('kubb/ApiSecurity', { requiredForClient: true }) {}

const securitySchemes: Readonly<Record<SecuritySchemeName, SecurityScheme>> = {
${schemeEntries}
}

const securityRequirements: Readonly<Record<string, ReadonlyArray<ReadonlyArray<SecurityRequirementEntry>>>> = {
${requirementEntries}
}

function credentialMatchesScheme({ credential, scheme }: { credential: SecurityCredential; scheme: SecurityScheme }): boolean {
  if (scheme.credential === 'apiKey') return credential._tag === 'ApiKey'
  if (scheme.credential === 'basic') return credential._tag === 'Basic'
  if (scheme.credential === 'bearer') return credential._tag === 'Bearer'
  return credential._tag === 'Authorization'
}

function resolveCredential<E, R>({
  endpoint,
  entry,
  options,
}: {
  endpoint: string
  entry: SecurityRequirementEntry
  options: SecurityLayerOptions<E, R>
}): Effect.Effect<SecurityCredential | undefined, SecurityCredentialResolutionError, R> {
  const scheme = securitySchemes[entry.name]
  const credential = options.credentials?.[entry.name]
  if (credential) {
    return credentialMatchesScheme({ credential, scheme })
      ? Effect.succeed(credential)
      : Effect.fail(new SecurityCredentialResolutionError({ endpoint, scheme: entry.name, cause: 'Credential type does not match its scheme' }))
  }
  if (!options.resolve) return Effect.succeed(undefined)

  return options.resolve({ endpoint, scheme: entry.name, scopes: entry.scopes }).pipe(
    Effect.mapError((cause) => new SecurityCredentialResolutionError({ endpoint, scheme: entry.name, cause })),
    Effect.flatMap((resolved) => {
      if (!resolved || credentialMatchesScheme({ credential: resolved, scheme })) return Effect.succeed(resolved)
      return Effect.fail(new SecurityCredentialResolutionError({ endpoint, scheme: entry.name, cause: 'Credential type does not match its scheme' }))
    }),
  )
}

function resolveAlternative<E, R>({
  endpoint,
  requirement,
  options,
}: {
  endpoint: string
  requirement: ReadonlyArray<SecurityRequirementEntry>
  options: SecurityLayerOptions<E, R>
}): Effect.Effect<Array<ResolvedCredential> | undefined, SecurityCredentialResolutionError, R> {
  return Effect.gen(function* () {
    const resolved: Array<ResolvedCredential> = []
    for (const entry of requirement) {
      const credential = yield* resolveCredential({ endpoint, entry, options })
      if (!credential) return undefined
      resolved.push({ scheme: securitySchemes[entry.name], credential })
    }
    return resolved
  })
}

function applyCredential({ request, resolved }: { request: HttpClientRequest.HttpClientRequest; resolved: ResolvedCredential }) {
  const { credential, scheme } = resolved
  if (credential._tag === 'Basic') return HttpClientRequest.basicAuth(request, credential.username, credential.password)
  if (credential._tag === 'Bearer') return HttpClientRequest.bearerToken(request, credential.token)
  if (credential._tag === 'Authorization') return HttpClientRequest.setHeader(request, 'Authorization', Redacted.value(credential.value))

  if (scheme.credential !== 'apiKey') throw new Error('API key credential resolved with a non-API-key scheme')
  const value = Redacted.value(credential.value)
  if (scheme.in === 'header') return HttpClientRequest.setHeader(request, scheme.wireName, value)
  if (scheme.in === 'query') return HttpClientRequest.setUrlParam(request, scheme.wireName, value)

  const cookie = \`${'${encodeURIComponent(scheme.wireName)}'}=${'${encodeURIComponent(value)}'}\`
  const previous = request.headers['cookie']
  return HttpClientRequest.setHeader(request, 'Cookie', previous ? \`${'${previous}'}; ${'${cookie}'}\` : cookie)
}

/**
 * Creates the client middleware Layer used by secured generated endpoints.
 */
export function makeSecurityLayer<E = never, R = never>(options: SecurityLayerOptions<E, R> = {}) {
  return HttpApiMiddleware.layerClient(ApiSecurity, ({ endpoint, request, next }) =>
    Effect.gen(function* () {
      const requirements = securityRequirements[endpoint.identifier] ?? []
      for (const requirement of requirements) {
        const resolved = yield* resolveAlternative({ endpoint: endpoint.identifier, requirement, options })
        if (!resolved) continue
        return yield* next(resolved.reduce((current, credential) => applyCredential({ request: current, resolved: credential }), request))
      }

      return yield* new MissingSecurityCredentials({
        endpoint: endpoint.identifier,
        requirements: requirements.map((requirement) => requirement.map((entry) => entry.name)),
      })
    }),
  )
}
`
}
