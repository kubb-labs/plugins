import { describe, expect, test } from 'vitest'
import { resolveClient } from './resolveClient.ts'

describe('resolveClient', () => {
  test("client: 'fetch' selects plugin-fetch when it is registered", () => {
    expect(resolveClient({ client: 'fetch', pluginNames: ['plugin-ts', 'plugin-fetch'] })).toStrictEqual({ kind: 'contract', pluginName: 'plugin-fetch' })
  })

  test("client: 'axios' selects plugin-axios when it is registered", () => {
    expect(resolveClient({ client: 'axios', pluginNames: ['plugin-ts', 'plugin-axios'] })).toStrictEqual({ kind: 'contract', pluginName: 'plugin-axios' })
  })

  test("client: 'fetch' without plugin-fetch returns a diagnostic naming the package", () => {
    const result = resolveClient({ client: 'fetch', pluginNames: ['plugin-ts'] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.message).toContain('@kubb/plugin-fetch')
  })

  test('an unknown client selector returns a diagnostic listing the allowed values', () => {
    const result = resolveClient({ client: 'bogus' as unknown as 'fetch', pluginNames: ['plugin-ts', 'plugin-fetch'] })
    expect(result).toStrictEqual({
      kind: 'error',
      message: "Option `client` is 'bogus', but it must be one of 'fetch', 'axios'. Drop `client` to use the registered client plugin.",
    })
  })

  test('auto-detects a lone contract client plugin when client is unset', () => {
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts', 'plugin-fetch'] })).toStrictEqual({ kind: 'contract', pluginName: 'plugin-fetch' })
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts', 'plugin-axios'] })).toStrictEqual({ kind: 'contract', pluginName: 'plugin-axios' })
  })

  test('two contract client plugins without a selector is ambiguous', () => {
    const result = resolveClient({ client: undefined, pluginNames: ['plugin-fetch', 'plugin-axios'] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.message).toContain("client: 'fetch' | 'axios'")
  })

  test('no client plugin registered returns a diagnostic asking to add one', () => {
    const result = resolveClient({ client: undefined, pluginNames: ['plugin-ts'] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.message).toContain('@kubb/plugin-axios')
      expect(result.message).toContain('@kubb/plugin-fetch')
    }
  })
})
