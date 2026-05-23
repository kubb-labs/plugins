import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.fn()
const create = vi.fn(() => ({ request }))

vi.mock('axios', () => ({
  default: {
    create,
  },
}))

describe('axios client', () => {
  beforeEach(() => {
    request.mockReset()
  })

  it('sets the Content-Type header from config.contentType', async () => {
    const { fetch: client } = await import('./axios.ts')

    request.mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
    })

    await client({
      url: '/pets',
      method: 'POST',
      data: { name: 'Dog' },
      contentType: 'application/json',
    })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    )
  })

  it('does not set Content-Type for multipart/form-data', async () => {
    const { fetch: client } = await import('./axios.ts')

    request.mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
    })

    await client({
      url: '/pets',
      method: 'POST',
      data: new FormData(),
      contentType: 'multipart/form-data',
    })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {},
      }),
    )
  })
})
