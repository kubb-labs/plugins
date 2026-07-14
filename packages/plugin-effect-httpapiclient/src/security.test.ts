import { describe, expect, test } from 'vitest'
import { resolveOperationSecurity, type SecurityDocument } from './security.ts'

const document: SecurityDocument = {
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' },
      oauth: { type: 'oauth2' },
      apiKey: { type: 'apiKey', name: 'x-api-key', in: 'header' },
    },
  },
  paths: {
    '/pets': {
      get: { security: [{ oauth: ['read:pets'], apiKey: [] }, {}] },
      post: { security: [] },
    },
  },
}

describe('resolveOperationSecurity', () => {
  test('preserves ordered OR alternatives, AND entries, and scopes', () => {
    expect(resolveOperationSecurity({ document, method: 'GET', path: '/pets' })).toStrictEqual({
      requirements: [
        [
          { name: 'oauth', scopes: ['read:pets'] },
          { name: 'apiKey', scopes: [] },
        ],
        [],
      ],
      schemes: [
        { name: 'oauth', credential: 'bearer' },
        { name: 'apiKey', credential: 'apiKey', in: 'header', wireName: 'x-api-key' },
      ],
    })
  })

  test('uses global security when an operation has no override', () => {
    expect(resolveOperationSecurity({ document, method: 'DELETE', path: '/pets' })?.requirements).toStrictEqual([[{ name: 'bearerAuth', scopes: [] }]])
  })

  test('disables inherited security for an explicit empty operation array', () => {
    expect(resolveOperationSecurity({ document, method: 'POST', path: '/pets' })).toBeNull()
  })

  test('rejects AND requirements that overwrite the same request slot', () => {
    const conflicting: SecurityDocument = {
      components: {
        securitySchemes: {
          first: { type: 'http', scheme: 'bearer' },
          second: { type: 'oauth2' },
        },
      },
      security: [{ first: [], second: [] }],
    }

    expect(() => resolveOperationSecurity({ document: conflicting, method: 'GET', path: '/pets' })).toThrow('both write header:authorization')
  })
})
