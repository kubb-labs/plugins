import { describe, expect, test } from 'vitest'
import { resolveClient } from './resolveClient.ts'

describe('resolveClient', () => {
  test("client: 'fetch' selects plugin-fetch when it is registered", () => {
    expect(resolveClient({ client: 'fetch', pluginNames: ['plugin-ts', 'plugin-fetch'] })).toStrictEqual({ kind: 'slim', pluginName: 'plugin-fetch' })
  })

  test("client: 'axios' selects plugin-axios when it is registered", () => {
    expect(resolveClient({ client: 'axios', pluginNames: ['plugin-ts', 'plugin-axios'] })).toStrictEqual({ kind: 'slim', pluginName: 'plugin-axios' })
  })

  test("client: 'fetch' without plugin-fetch returns a diagnostic naming the package", () => {
    const result = resolveClient({ client: 'fetch', pluginNames: ['plugin-ts'] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.message).toContain('@kubb/plugin-fetch')
  })

  test('the deprecated object form keeps the legacy path', () => {
    expect(resolveClient({ client: { importPath: 'axios' }, pluginNames: ['plugin-ts'] })).toStrictEqual({ kind: 'legacy' })
  })

  test('a registered plugin-client keeps the legacy path', () => {
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts', 'plugin-client'] })).toStrictEqual({ kind: 'legacy' })
  })

  test('auto-detects a lone slim plugin when client is unset', () => {
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts', 'plugin-fetch'] })).toStrictEqual({ kind: 'slim', pluginName: 'plugin-fetch' })
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts', 'plugin-axios'] })).toStrictEqual({ kind: 'slim', pluginName: 'plugin-axios' })
  })

  test('two slim plugins without a selector is ambiguous', () => {
    const result = resolveClient({ client: undefined, pluginNames: ['plugin-fetch', 'plugin-axios'] })
    expect(result.kind).toBe('error')
    if (result.kind === 'error') expect(result.message).toContain("client: 'fetch' | 'axios'")
  })

  test('no client plugin falls back to the legacy default', () => {
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-ts'] })).toStrictEqual({ kind: 'legacy' })
  })

  test('an explicit plugin-client wins over a slim plugin when client is unset', () => {
    expect(resolveClient({ client: undefined, pluginNames: ['plugin-client', 'plugin-fetch'] })).toStrictEqual({ kind: 'legacy' })
  })
})
