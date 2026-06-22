import { describe, expect, test } from 'vitest'
import { buildSchemesMetadata, buildSecurityMetadata, getOperationSecurity, resolveSecurityScheme, type SecurityDocument } from './security.ts'

describe('buildSecurityMetadata', () => {
  test('returns null when there are no requirements', () => {
    expect(buildSecurityMetadata({ security: undefined })).toBeNull()
    expect(buildSecurityMetadata({ security: [] })).toBeNull()
  })

  test('serializes a scheme with no scopes', () => {
    expect(buildSecurityMetadata({ security: [{ bearerAuth: [] }] })).toBe('[{ bearerAuth: [] }]')
  })

  test('serializes scopes as single-quoted strings', () => {
    expect(buildSecurityMetadata({ security: [{ oauth2: ['read', 'write'] }] })).toBe("[{ oauth2: ['read', 'write'] }]")
  })

  test('quotes scheme names that are not valid identifiers', () => {
    expect(buildSecurityMetadata({ security: [{ 'api-key': [] }] })).toBe("[{ 'api-key': [] }]")
  })

  test('serializes multiple requirements', () => {
    expect(buildSecurityMetadata({ security: [{ bearerAuth: [] }, { apiKey: [] }] })).toBe('[{ bearerAuth: [] }, { apiKey: [] }]')
  })
})

describe('buildSchemesMetadata', () => {
  test('returns null when there are no schemes', () => {
    expect(buildSchemesMetadata({ schemes: undefined })).toBeNull()
    expect(buildSchemesMetadata({ schemes: {} })).toBeNull()
  })

  test('serializes a bearer scheme', () => {
    expect(buildSchemesMetadata({ schemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } })).toBe("{ bearerAuth: { type: 'http', scheme: 'bearer' } }")
  })

  test('serializes an apiKey scheme', () => {
    expect(buildSchemesMetadata({ schemes: { apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' } } })).toBe(
      "{ apiKey: { type: 'apiKey', name: 'X-API-Key', in: 'header' } }",
    )
  })

  test('quotes scheme names that are not valid identifiers', () => {
    expect(buildSchemesMetadata({ schemes: { 'api-key': { type: 'http', scheme: 'basic' } } })).toBe("{ 'api-key': { type: 'http', scheme: 'basic' } }")
  })
})

describe('resolveSecurityScheme', () => {
  test('maps http bearer to bearer', () => {
    expect(resolveSecurityScheme({ type: 'http', scheme: 'bearer' })).toStrictEqual({ type: 'http', scheme: 'bearer' })
  })

  test('maps http basic to basic, case-insensitively', () => {
    expect(resolveSecurityScheme({ type: 'http', scheme: 'Basic' })).toStrictEqual({ type: 'http', scheme: 'basic' })
  })

  test('reduces oauth2 and openIdConnect to bearer', () => {
    expect(resolveSecurityScheme({ type: 'oauth2' })).toStrictEqual({ type: 'http', scheme: 'bearer' })
    expect(resolveSecurityScheme({ type: 'openIdConnect' })).toStrictEqual({ type: 'http', scheme: 'bearer' })
  })

  test('maps an apiKey in header or query', () => {
    expect(resolveSecurityScheme({ type: 'apiKey', name: 'X-API-Key', in: 'header' })).toStrictEqual({ type: 'apiKey', name: 'X-API-Key', in: 'header' })
    expect(resolveSecurityScheme({ type: 'apiKey', name: 'token', in: 'query' })).toStrictEqual({ type: 'apiKey', name: 'token', in: 'query' })
  })

  test('returns null for an apiKey the runtime cannot place', () => {
    expect(resolveSecurityScheme({ type: 'apiKey', name: 'sid', in: 'cookie' })).toBeNull()
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

  test('returns nothing without a document', () => {
    expect(getOperationSecurity({ document: undefined, method: 'GET', path: '/pet' })).toStrictEqual({ schemes: {} })
  })

  test('derives the operation-level requirement and its scheme', () => {
    expect(getOperationSecurity({ document, method: 'POST', path: '/pet' })).toStrictEqual({
      security: [{ petstore_auth: ['write:pets', 'read:pets'] }],
      schemes: { petstore_auth: { type: 'http', scheme: 'bearer' } },
    })
  })

  test('resolves every scheme referenced across multiple requirements', () => {
    expect(getOperationSecurity({ document, method: 'GET', path: '/pet/{petId}' })).toStrictEqual({
      security: [{ petstore_auth: ['read:pets'] }, { api_key: [] }],
      schemes: { petstore_auth: { type: 'http', scheme: 'bearer' }, api_key: { type: 'apiKey', name: 'api_key', in: 'header' } },
    })
  })

  test('falls back to the global security when the operation declares none', () => {
    expect(getOperationSecurity({ document, method: 'GET', path: '/pet' })).toStrictEqual({
      security: [{ globalAuth: [] }],
      schemes: { globalAuth: { type: 'http', scheme: 'bearer' } },
    })
  })

  test('treats an explicit empty operation security as no auth', () => {
    expect(getOperationSecurity({ document, method: 'DELETE', path: '/pet/{petId}' })).toStrictEqual({ schemes: {} })
  })

  test('omits a referenced scheme the runtime cannot place', () => {
    const cookieDocument: SecurityDocument = {
      security: [{ sessionAuth: [] }],
      components: { securitySchemes: { sessionAuth: { type: 'apiKey', name: 'sid', in: 'cookie' } } },
    }
    expect(getOperationSecurity({ document: cookieDocument, method: 'GET', path: '/pet' })).toStrictEqual({
      security: [{ sessionAuth: [] }],
      schemes: {},
    })
  })
})
