import { describe, expect, test } from 'vitest'
import { getOperationBaseURL, type ServerDocument } from './server.ts'

const document: ServerDocument = {
  paths: {
    '/upload': {
      servers: [{ url: 'https://upload.example.com' }, { url: 'https://upload.staging.example.com' }],
      post: { servers: [{ url: 'https://{region}.files.example.com', variables: { region: { default: 'eu' } } }] },
      get: {},
    },
    '/pets': { get: {} },
  },
}

describe('getOperationBaseURL', () => {
  test('uses the path item servers, picked by index', () => {
    expect(getOperationBaseURL({ document, method: 'GET', path: '/upload' })).toBe('https://upload.example.com')
    expect(getOperationBaseURL({ document, method: 'GET', path: '/upload', server: { index: 1 } })).toBe('https://upload.staging.example.com')
  })

  test('lets the operation servers win, falling back to the first entry and filling variables', () => {
    expect(getOperationBaseURL({ document, method: 'POST', path: '/upload', server: { index: 1 } })).toBe('https://eu.files.example.com')
    expect(getOperationBaseURL({ document, method: 'POST', path: '/upload', server: { variables: { region: 'us' } } })).toBe('https://us.files.example.com')
  })

  test('returns undefined without path or operation servers', () => {
    expect(getOperationBaseURL({ document, method: 'GET', path: '/pets' })).toBeUndefined()
    expect(getOperationBaseURL({ document: null, method: 'GET', path: '/pets' })).toBeUndefined()
  })
})
