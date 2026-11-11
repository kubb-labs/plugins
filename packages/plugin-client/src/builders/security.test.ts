import type { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildSecurityMetadata, buildSecuritySchemes, getOperationSecurity, resolveCredential } from './security.ts'

describe('buildSecurityMetadata', () => {
  test('returns null when there is no security', () => {
    expect(buildSecurityMetadata({ security: undefined })).toBeNull()
    expect(buildSecurityMetadata({ security: [] })).toBeNull()
  })
})

describe('resolveCredential', () => {
  test('keeps http basic as basic', () => {
    expect(resolveCredential({ type: 'http', scheme: 'basic' })).toStrictEqual({ type: 'http', scheme: 'basic' })
  })

  test('treats an unknown http scheme as bearer', () => {
    expect(resolveCredential({ type: 'http', scheme: 'digest' })).toStrictEqual({ type: 'http', scheme: 'bearer' })
  })

  test('keeps the OAuth2 flow URLs and metadata URL, without the scope descriptions', () => {
    const credential: ast.AuthCredential = {
      type: 'oauth2',
      metadataUrl: 'https://auth.example.com/.well-known/oauth-authorization-server',
      flows: {
        deviceAuthorization: {
          deviceAuthorizationUrl: 'https://auth.example.com/device',
          tokenUrl: 'https://auth.example.com/token',
          scopes: { read: 'Read' },
        },
      },
    }
    expect(resolveCredential(credential)).toStrictEqual({
      type: 'oauth2',
      metadataUrl: 'https://auth.example.com/.well-known/oauth-authorization-server',
      flows: { deviceAuthorization: { deviceAuthorizationUrl: 'https://auth.example.com/device', tokenUrl: 'https://auth.example.com/token' } },
    })
    expect(resolveCredential({ type: 'oauth2', flows: {} })).toStrictEqual({ type: 'oauth2' })
  })

  test('keeps the OpenID Connect discovery URL', () => {
    expect(resolveCredential({ type: 'openIdConnect', url: 'https://auth.example.com' })).toStrictEqual({
      type: 'openIdConnect',
      url: 'https://auth.example.com',
    })
  })

  test('returns null for mutualTLS, which the runtime cannot send', () => {
    expect(resolveCredential({ type: 'mutualTLS' })).toBeNull()
  })
})

describe('getOperationSecurity', () => {
  const schemes: Array<ast.AuthScheme> = [
    { name: 'api_key', credential: { type: 'apiKey', name: 'api_key', in: 'header' } },
    { name: 'session', credential: { type: 'apiKey', name: 'sid', in: 'cookie' } },
    { name: 'mtls', credential: { type: 'mutualTLS' } },
    { name: 'petstore_auth', credential: { type: 'oauth2', flows: {} } },
  ]

  test('treats a missing or empty auth list as no auth', () => {
    expect(getOperationSecurity({ auth: undefined, schemes })).toBeUndefined()
    expect(getOperationSecurity({ auth: [], schemes })).toBeUndefined()
  })

  test('omits a requirement with a scheme the runtime cannot place or that is not declared', () => {
    expect(getOperationSecurity({ auth: [[{ scheme: 'mtls' }], [{ scheme: 'missing' }]], schemes })).toBeUndefined()
  })

  test('groups the schemes one requirement needs together, and drops repeated and unmet requirements', () => {
    const security = getOperationSecurity({
      auth: [
        [{ scheme: 'api_key' }, { scheme: 'session' }],
        [{ scheme: 'mtls' }, { scheme: 'api_key' }],
        [{ scheme: 'api_key' }, { scheme: 'session' }],
        [{ scheme: 'petstore_auth', scopes: ['read:pets'] }],
      ],
      schemes,
    })
    expect(security).toStrictEqual([
      [
        { type: 'apiKey', name: 'api_key', in: 'header' },
        { type: 'apiKey', name: 'sid', in: 'cookie' },
      ],
      { type: 'oauth2', scopes: ['read:pets'] },
    ])
    expect(buildSecurityMetadata({ security })).toBe(
      "[[{ type: 'apiKey', name: 'api_key', in: 'header' }, { type: 'apiKey', name: 'sid', in: 'cookie' }], { type: 'oauth2', scopes: ['read:pets'] }]",
    )
  })

  test('keeps two requirements on one scheme with different scopes', () => {
    const auth = [[{ scheme: 'petstore_auth', scopes: ['read:pets'] }], [{ scheme: 'petstore_auth', scopes: ['write:pets'] }]]
    expect(getOperationSecurity({ auth, schemes })).toStrictEqual([
      { type: 'oauth2', scopes: ['read:pets'] },
      { type: 'oauth2', scopes: ['write:pets'] },
    ])
  })

  test('quotes flow names that are not identifiers', () => {
    const security = [
      { type: 'oauth2' as const, flows: { implicit: { authorizationUrl: 'https://a.example.com' }, 'x-vendor': { tokenUrl: 'https://t.example.com' } } },
    ]
    expect(buildSecurityMetadata({ security })).toBe(
      "[{ type: 'oauth2', flows: { implicit: { authorizationUrl: 'https://a.example.com' }, 'x-vendor': { tokenUrl: 'https://t.example.com' } } }]",
    )
  })

  test('escapes quotes in names and scopes', () => {
    const security = [{ type: 'apiKey' as const, name: "X-It's-Key", in: 'header' as const, scopes: ["it's"] }]
    expect(buildSecurityMetadata({ security })).toBe("[{ type: 'apiKey', name: 'X-It\\'s-Key', in: 'header', scopes: ['it\\'s'] }]")
  })

  test('points at the hoisted scheme by name, and adds the scopes of the requirement', () => {
    const auth = [[{ scheme: 'api_key', scopes: [] }], [{ scheme: 'petstore_auth', scopes: ['read:pets'] }]]
    const hoisted: Array<ast.AuthScheme> = [...schemes, { name: 'x-key', credential: { type: 'apiKey', name: 'X-Key', in: 'header' } }]

    expect(buildSecurityMetadata({ security: getOperationSecurity({ auth, schemes, hoist: true }) })).toBe(
      "[securitySchemes.api_key, { ...securitySchemes.petstore_auth, scopes: ['read:pets'] }]",
    )
    expect(buildSecurityMetadata({ security: getOperationSecurity({ auth: [[{ scheme: 'x-key', scopes: [] }]], schemes: hoisted, hoist: true }) })).toBe(
      "[securitySchemes['x-key']]",
    )
  })
})

describe('buildSecuritySchemes', () => {
  test('lists the schemes the runtime can place by name, and nothing for a document without one', () => {
    const schemes: Array<ast.AuthScheme> = [
      { name: 'x-key', credential: { type: 'apiKey', name: 'X-Key', in: 'header' } },
      { name: 'mtls', credential: { type: 'mutualTLS' } },
    ]

    expect(buildSecuritySchemes(schemes)).toContain("export const securitySchemes = { 'x-key': { type: 'apiKey', name: 'X-Key', in: 'header' } } as const")
    expect(buildSecuritySchemes([{ name: 'mtls', credential: { type: 'mutualTLS' } }])).toBeNull()
    expect(buildSecuritySchemes(undefined)).toBeNull()
  })
})
