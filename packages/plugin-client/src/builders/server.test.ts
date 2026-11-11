import { describe, expect, test } from 'vitest'
import { getOperationBaseURL } from './server.ts'

const upload = [{ url: 'https://upload.example.com' }, { url: 'https://upload.staging.example.com' }]

describe('getOperationBaseURL', () => {
  test('picks the operation servers by index', () => {
    expect(getOperationBaseURL({ servers: upload })).toBe('https://upload.example.com')
    expect(getOperationBaseURL({ servers: upload, server: { index: 1 } })).toBe('https://upload.staging.example.com')
  })

  test('falls back to the first entry', () => {
    expect(getOperationBaseURL({ servers: [{ url: 'https://files.example.com' }], server: { index: 1 } })).toBe('https://files.example.com')
  })

  test('returns undefined without servers, or for a relative or templated server URL', () => {
    expect(getOperationBaseURL({ servers: undefined })).toBeUndefined()
    expect(getOperationBaseURL({ servers: [{ url: '/v2' }] })).toBeUndefined()
    expect(getOperationBaseURL({ servers: [{ url: 'https://eu.example.com', variables: { region: { default: 'eu' } } }] })).toBeUndefined()
  })
})
