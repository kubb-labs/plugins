import { describe, expect, test } from 'vitest'
import { getOperationBaseURL, type ServerDocument } from './server.ts'

const document: ServerDocument = {
  paths: {
    '/upload': {
      servers: [{ url: 'https://upload.example.com' }, { url: 'https://upload.staging.example.com' }],
      post: { servers: [{ url: 'https://files.example.com' }] },
      get: {},
    },
    '/pets': { get: {} },
    '/v2/pets': { servers: [{ url: '/v2' }], get: {} },
    '/regions': { servers: [{ url: 'https://{region}.example.com' }], get: {} },
  },
}

describe('getOperationBaseURL', () => {
  test('uses the path item servers, picked by index', () => {
    expect(getOperationBaseURL({ document, method: 'GET', path: '/upload' })).toBe('https://upload.example.com')
    expect(getOperationBaseURL({ document, method: 'GET', path: '/upload', server: { index: 1 } })).toBe('https://upload.staging.example.com')
  })

  test('lets the operation servers win, falling back to the first entry', () => {
    expect(getOperationBaseURL({ document, method: 'POST', path: '/upload', server: { index: 1 } })).toBe('https://files.example.com')
  })

  test('returns undefined without servers, or for a relative or templated server URL', () => {
    expect(getOperationBaseURL({ document, method: 'GET', path: '/pets' })).toBeUndefined()
    expect(getOperationBaseURL({ document: null, method: 'GET', path: '/pets' })).toBeUndefined()
    expect(getOperationBaseURL({ document, method: 'GET', path: '/v2/pets' })).toBeUndefined()
    expect(getOperationBaseURL({ document, method: 'GET', path: '/regions' })).toBeUndefined()
  })
})
