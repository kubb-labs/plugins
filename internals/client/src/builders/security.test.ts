import { describe, expect, test } from 'vitest'
import { buildSecurityMetadata } from './security.ts'

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
