import { Diagnostics } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { resolveClient, resolveContractClient } from './resolveClient.ts'

describe('resolveClient', () => {
  test.each(['fetch', 'axios', 'client'] as const)('client: %s selects the matching plugin when it is registered', (client) => {
    expect(resolveClient({ client, pluginNames: ['plugin-ts', `plugin-${client}`] })).toStrictEqual({ kind: 'contract', pluginName: `plugin-${client}` })
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
      code: 'KUBB_INVALID_PLUGIN_OPTIONS',
      message: "Option `client` is 'bogus', but it must be one of 'fetch', 'axios', 'client'.",
      help: 'Set `client` to one of those values, or drop it to use the registered client plugin.',
    })
  })

  test('auto-detects a lone contract client plugin when client is unset', () => {
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts', 'plugin-fetch'] })).toStrictEqual({ kind: 'contract', pluginName: 'plugin-fetch' })
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts', 'plugin-axios'] })).toStrictEqual({ kind: 'contract', pluginName: 'plugin-axios' })
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts', 'plugin-client'] })).toStrictEqual({ kind: 'contract', pluginName: 'plugin-client' })
  })

  test('two contract client plugins without a selector is ambiguous', () => {
    const result = resolveClient({ client: undefined, pluginNames: ['plugin-fetch', 'plugin-axios'] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.help).toContain("client: 'fetch' | 'axios' | 'client'")
  })

  test('no client plugin registered returns a diagnostic asking to add one', () => {
    const result = resolveClient({ client: undefined, pluginNames: ['plugin-ts'] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.help).toContain('@kubb/plugin-axios')
      expect(result.help).toContain('@kubb/plugin-fetch')
      expect(result.help).toContain('@kubb/plugin-client')
    }
  })
})

describe('resolveContractClient', () => {
  const resolveError = (options: Parameters<typeof resolveContractClient>[0]) => {
    try {
      resolveContractClient(options)
    } catch (error) {
      if (Diagnostics.isError(error)) return error.diagnostic
      throw error
    }
    throw new Error('expected resolveContractClient to throw')
  }

  test.each([
    ['no client plugin is registered', { client: undefined, plugins: [{ name: 'plugin-ts' }] }, 'KUBB_MISSING_DEPENDENCY'],
    ['the selected client plugin is not registered', { client: 'axios' as const, plugins: [{ name: 'plugin-fetch' }] }, 'KUBB_MISSING_DEPENDENCY'],
    [
      'several client plugins are registered without a selector',
      { client: undefined, plugins: [{ name: 'plugin-fetch' }, { name: 'plugin-axios' }] },
      'KUBB_INVALID_PLUGIN_OPTIONS',
    ],
    ['the selector is unknown', { client: 'bogus' as unknown as 'fetch', plugins: [{ name: 'plugin-fetch' }] }, 'KUBB_INVALID_PLUGIN_OPTIONS'],
  ])('throws a config diagnostic when %s', (_, options, code) => {
    const diagnostic = resolveError({ plugin: 'plugin-react-query', ...options })
    expect(diagnostic).toMatchObject({ code, severity: 'error', plugin: 'plugin-react-query', location: { kind: 'config' } })
    expect(diagnostic.help).toBeTruthy()
  })

  test('returns the contract client when one is registered', () => {
    expect(resolveContractClient({ plugin: 'plugin-swr', client: undefined, plugins: [{ name: 'plugin-fetch' }] })).toStrictEqual({
      kind: 'contract',
      pluginName: 'plugin-fetch',
    })
  })
})
