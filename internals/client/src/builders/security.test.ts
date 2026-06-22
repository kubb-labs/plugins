import { describe, expect, test } from 'vitest'
import { buildSecurityMetadata, getOperationSecurity, resolveSecurityScheme, type SecurityDocument } from './security.ts'

describe('buildSecurityMetadata', () => {
  test('returns null when there is no security', () => {
    expect(buildSecurityMetadata({ security: undefined })).toBeNull()
    expect(buildSecurityMetadata({ security: [] })).toBeNull()
  })

  test('serializes a bearer scheme', () => {
    expect(buildSecurityMetadata({ security: [{ type: 'http', scheme: 'bearer' }] })).toBe("[{ type: 'http', scheme: 'bearer' }]")
  })

  test('serializes an apiKey scheme with name and location', () => {
    expect(buildSecurityMetadata({ security: [{ type: 'apiKey', name: 'X-API-Key', in: 'header' }] })).toBe(
      "[{ type: 'apiKey', name: 'X-API-Key', in: 'header' }]",
    )
  })

  test('serializes oauth2 as a bare type', () => {
    expect(buildSecurityMetadata({ security: [{ type: 'oauth2' }] })).toBe("[{ type: 'oauth2' }]")
  })

  test('serializes multiple schemes', () => {
    expect(buildSecurityMetadata({ security: [{ type: 'oauth2' }, { type: 'apiKey', name: 'api_key', in: 'header' }] })).toBe(
      "[{ type: 'oauth2' }, { type: 'apiKey', name: 'api_key', in: 'header' }]",
    )
  })
})

describe('resolveSecurityScheme', () => {
  test('maps http bearer to bearer', () => {
    expect(resolveSecurityScheme({ type: 'http', scheme: 'bearer' })).toStrictEqual({ type: 'http', scheme: 'bearer' })
  })

  test('maps http basic to basic, case-insensitively', () => {
    expect(resolveSecurityScheme({ type: 'http', scheme: 'Basic' })).toStrictEqual({ type: 'http', scheme: 'basic' })
  })

  test('treats an unknown http scheme as bearer', () => {
    expect(resolveSecurityScheme({ type: 'http', scheme: 'digest' })).toStrictEqual({ type: 'http', scheme: 'bearer' })
  })

  test('keeps oauth2 and openIdConnect as their own type', () => {
    expect(resolveSecurityScheme({ type: 'oauth2' })).toStrictEqual({ type: 'oauth2' })
    expect(resolveSecurityScheme({ type: 'openIdConnect' })).toStrictEqual({ type: 'openIdConnect' })
  })

  test('maps an apiKey in header, query, or cookie', () => {
    expect(resolveSecurityScheme({ type: 'apiKey', name: 'X-API-Key', in: 'header' })).toStrictEqual({ type: 'apiKey', name: 'X-API-Key', in: 'header' })
    expect(resolveSecurityScheme({ type: 'apiKey', name: 'token', in: 'query' })).toStrictEqual({ type: 'apiKey', name: 'token', in: 'query' })
    expect(resolveSecurityScheme({ type: 'apiKey', name: 'sid', in: 'cookie' })).toStrictEqual({ type: 'apiKey', name: 'sid', in: 'cookie' })
  })

  test('returns null for an apiKey the runtime cannot place', () => {
    expect(resolveSecurityScheme({ type: 'apiKey', name: 'sid', in: 'body' })).toBeNull()
    expect(resolveSecurityScheme({ type: 'apiKey', in: 'header' })).toBeNull()
  })

  test('returns null for an unresolved $ref or a missing scheme', () => {
    expect(resolveSecurityScheme({ $ref: '#/components/securitySchemes/bearerAuth' })).toBeNull()
    expect(resolveSecurityScheme(undefined)).toBeNull()
  })
})

describe('getOperationSecurity', () => {
  const document: SecurityDocument = {
    security: [{ globalAuth: [] }],
    components: {
      securitySchemes: {
        globalAuth: { type: 'http', scheme: 'bearer' },
        petstore_auth: { type: 'oauth2' },
        api_key: { type: 'apiKey', name: 'api_key', in: 'header' },
      },
    },
    paths: {
      '/pet': {
        post: { security: [{ petstore_auth: ['write:pets', 'read:pets'] }] },
      },
      '/pet/{petId}': {
        get: { security: [{ petstore_auth: ['read:pets'] }, { api_key: [] }] },
        delete: { security: [] },
      },
    },
  }

  test('returns undefined without a document', () => {
    expect(getOperationSecurity({ document: undefined, method: 'GET', path: '/pet' })).toBeUndefined()
  })

  test('resolves the operation-level scheme', () => {
    expect(getOperationSecurity({ document, method: 'POST', path: '/pet' })).toStrictEqual([{ type: 'oauth2' }])
  })

  test('resolves every scheme referenced across multiple requirements', () => {
    expect(getOperationSecurity({ document, method: 'GET', path: '/pet/{petId}' })).toStrictEqual([
      { type: 'oauth2' },
      { type: 'apiKey', name: 'api_key', in: 'header' },
    ])
  })

  test('falls back to the global security when the operation declares none', () => {
    expect(getOperationSecurity({ document, method: 'GET', path: '/pet' })).toStrictEqual([{ type: 'http', scheme: 'bearer' }])
  })

  test('treats an explicit empty operation security as no auth', () => {
    expect(getOperationSecurity({ document, method: 'DELETE', path: '/pet/{petId}' })).toBeUndefined()
  })

  test('omits a referenced scheme the runtime cannot place', () => {
    const bodyDocument: SecurityDocument = {
      security: [{ weird: [] }],
      components: { securitySchemes: { weird: { type: 'apiKey', name: 'sid', in: 'body' } } },
    }
    expect(getOperationSecurity({ document: bodyDocument, method: 'GET', path: '/pet' })).toBeUndefined()
  })
})
