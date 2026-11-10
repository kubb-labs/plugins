import type { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildSecurityMetadata, getOperationSecurity, resolveCredential } from './security.ts'

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

  test('keeps only the fields the runtime reads', () => {
    expect(resolveCredential({ type: 'oauth2', flows: { clientCredentials: { tokenUrl: 'https://auth.example.com' } } })).toStrictEqual({ type: 'oauth2' })
    expect(resolveCredential({ type: 'openIdConnect', url: 'https://auth.example.com' })).toStrictEqual({ type: 'openIdConnect' })
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
})
