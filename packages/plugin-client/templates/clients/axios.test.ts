import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosInstance, client } from './axios'

function mockRequest() {
  return vi.spyOn(axiosInstance, 'request').mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {} })
}

describe('client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps the axios default validateStatus so non-2xx responses reject', async () => {
    using request = mockRequest()

    await client({ method: 'GET', url: 'https://example.com/status' })

    expect(request.mock.calls[0]![0]).not.toHaveProperty('validateStatus')
  })

  it('accepts every status when throwOnError is false', async () => {
    using request = mockRequest()

    await client({ method: 'GET', url: 'https://example.com/status', throwOnError: false })

    const { validateStatus } = request.mock.calls[0]![0] as { validateStatus?: (status: number) => boolean }
    expect(validateStatus?.(422)).toBe(true)
    expect(validateStatus?.(500)).toBe(true)
  })

  it('keeps a custom validateStatus over throwOnError', async () => {
    using request = mockRequest()
    const validateStatus = (status: number) => status < 500

    await client({ method: 'GET', url: 'https://example.com/status', throwOnError: false, validateStatus })

    expect((request.mock.calls[0]![0] as { validateStatus?: unknown }).validateStatus).toBe(validateStatus)
  })

  it('does not forward throwOnError to axios', async () => {
    using request = mockRequest()

    await client({ method: 'GET', url: 'https://example.com/status', throwOnError: false })

    expect(request.mock.calls[0]![0]).not.toHaveProperty('throwOnError')
  })
})
