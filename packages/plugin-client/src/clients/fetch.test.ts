import { beforeEach, describe, expect, it, vi } from 'vitest'
import { client, getConfig, setConfig } from './fetch'

// Mock the global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('fetch client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    setConfig({})
  })

  describe('FormData handling', () => {
    it('should pass FormData directly without JSON.stringify', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }))
      formData.append('name', 'test-file.txt')

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/upload',
        method: 'POST',
        data: formData,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/upload',
        expect.objectContaining({
          method: 'POST',
          body: formData,
        }),
      )

      // Verify that the body is the actual FormData instance, not a stringified version
      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
      expect(callArgs?.[1]?.body).toBe(formData)
    })

    it('should JSON.stringify regular objects', async () => {
      const data = { name: 'John', age: 30 }

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/api/users',
        method: 'POST',
        data,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        }),
      )

      // Verify that the body is a string
      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(typeof callArgs?.[1]?.body).toBe('string')
      expect(callArgs?.[1]?.body).toBe('{"name":"John","age":30}')
    })

    it('should handle FormData with multiple files', async () => {
      const formData = new FormData()
      const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' })
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' })
      formData.append('files', file1)
      formData.append('files', file2)
      formData.append('description', 'Multiple files upload')

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/upload-multiple',
        method: 'POST',
        data: formData,
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
      expect(callArgs?.[1]?.body).toBe(formData)
    })

    it('should handle empty FormData', async () => {
      const formData = new FormData()

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({ success: true }),
      })

      await client({
        url: '/upload',
        method: 'POST',
        data: formData,
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs?.[1]?.body).toBeInstanceOf(FormData)
    })
  })

  describe('basic functionality', () => {
    it('should make a GET request', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({ data: 'test' }),
      })

      const response = await client({
        url: '/api/test',
        method: 'GET',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        }),
      )
      expect(response.data).toStrictEqual({ data: 'test' })
    })

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({}),
      })

      await client({
        url: '/api/search',
        method: 'GET',
        params: { q: 'test', page: 1 },
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/search?q=test&page=1', expect.any(Object))
    })

    it('should merge baseURL with url', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({}),
      })

      await client({
        baseURL: 'https://api.example.com',
        url: '/users',
        method: 'GET',
      })

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', expect.any(Object))
    })

    it('should use global config', async () => {
      setConfig({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' },
      })

      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({}),
      })

      await client({
        url: '/users',
        method: 'GET',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: { Authorization: 'Bearer token' },
        }),
      )

      expect(getConfig()).toStrictEqual({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' },
      })
    })

    it('should handle no content responses', async () => {
      mockFetch.mockResolvedValue({
        status: 204,
        statusText: 'No Content',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: null,
      })

      const response = await client({
        url: '/api/delete',
        method: 'DELETE',
      })

      expect(response.data).toStrictEqual({})
      expect(response.status).toBe(204)
    })

    it('should set Content-Type from config.contentType', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({}),
      })

      await client({
        url: '/api/users',
        method: 'POST',
        data: { name: 'John' },
        contentType: 'application/json',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    it('should not set Content-Type for multipart/form-data', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({}),
      })

      await client({
        url: '/api/upload',
        method: 'POST',
        data: new FormData(),
        contentType: 'multipart/form-data',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          headers: {},
        }),
      )
    })
  })

  describe('response parsing', () => {
    it('parses a text/plain response as text via Content-Type auto-detection', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        body: {},
        text: async () => 'hello world',
        json: async () => {
          throw new Error('should not be called')
        },
      })

      const response = await client({ url: '/api/text', method: 'GET' })

      expect(response.data).toBe('hello world')
    })

    it('parses an application/octet-stream response as a blob via Content-Type auto-detection', async () => {
      const blob = new Blob(['binary'])
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/octet-stream' }),
        body: {},
        blob: async () => blob,
      })

      const response = await client({ url: '/api/download', method: 'GET' })

      expect(response.data).toBe(blob)
    })

    it('honors an explicit responseType over the Content-Type header', async () => {
      const blob = new Blob(['binary'])
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        blob: async () => blob,
        json: async () => {
          throw new Error('should not be called')
        },
      })

      const response = await client({ url: '/api/download', method: 'GET', responseType: 'blob' })

      expect(response.data).toBe(blob)
    })

    it('encodes a plain object as URLSearchParams for application/x-www-form-urlencoded', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: {},
        json: async () => ({}),
      })

      await client({
        url: '/api/form',
        method: 'POST',
        data: { name: 'John', age: 30 },
        contentType: 'application/x-www-form-urlencoded',
      })

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs?.[1]?.body).toBeInstanceOf(URLSearchParams)
      expect((callArgs?.[1]?.body as URLSearchParams).toString()).toBe('name=John&age=30')
    })

    it('falls back to JSON.parse on the text body when no Content-Type header is present', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: {},
        text: async () => '{"parsed":true}',
      })

      const response = await client({ url: '/api/unknown', method: 'GET' })

      expect(response.data).toStrictEqual({ parsed: true })
    })
  })
})
