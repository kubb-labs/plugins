import { describe, expect, test, vi } from 'vitest'
import { cacheTransform } from './cache.ts'

describe('cacheTransform', () => {
  test('reuses the result for the same file, content and options', async () => {
    const transform = vi.fn(async ({ content }: { content: string }) => content.toUpperCase())
    const cached = cacheTransform(transform)

    expect(await cached({ fileName: 'a.yaml', content: 'a' })).toBe('A')
    expect(await cached({ fileName: 'a.yaml', content: 'a' })).toBe('A')
    expect(transform).toHaveBeenCalledTimes(1)
  })

  test('transforms again when the content or the options change', async () => {
    const transform = vi.fn(async ({ content }: { content: string }) => content)
    const cached = cacheTransform(transform)

    await cached({ fileName: 'a.yaml', content: 'a' })
    await cached({ fileName: 'a.yaml', content: 'b' })
    await cached({ fileName: 'a.yaml', content: 'b' }, { arrayType: 'generic' })
    expect(transform).toHaveBeenCalledTimes(3)
  })

  test('does not keep a failed transform', async () => {
    const transform = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok')
    const cached = cacheTransform(transform)

    await expect(cached({ fileName: 'a.yaml', content: 'a' })).rejects.toThrow('boom')
    expect(await cached({ fileName: 'a.yaml', content: 'a' })).toBe('ok')
  })
})
