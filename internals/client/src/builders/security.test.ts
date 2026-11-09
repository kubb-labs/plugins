import { describe, expect, test } from 'vitest'
import { buildSecurityMetadata, getOperationSecurity, resolveSecurityScheme, type SecurityDocument } from './security.ts'

describe('buildSecurityMetadata', () => {
  test('returns null when there is no security', () => {
    expect(buildSecurityMetadata({ security: undefined })).toBeNull()
    expect(buildSecurityMetadata({ security: [] })).toBeNull()
  })
})

describe('resolveSecurityScheme', () => {
  test('maps http basic to basic, case-insensitively', () => {
    expect(resolveSecurityScheme({ type: 'http', scheme: 'Basic' })).toStrictEqual({ type: 'http', scheme: 'basic' })
  })

  test('treats an unknown http scheme as bearer', () => {
    expect(resolveSecurityScheme({ type: 'http', scheme: 'digest' })).toStrictEqual({ type: 'http', scheme: 'bearer' })
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
