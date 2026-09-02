import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { resolveClient, resolveContractClient } from './resolveClient.ts'

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

describe('resolveContractClient', () => {
  let root: string

  function installPackage(name: string, version: string) {
    const pkgDir = path.join(root, 'node_modules', ...name.split('/'))
    fs.mkdirSync(pkgDir, { recursive: true })
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name, version }))
  }

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-resolve-contract-client-'))
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '0.0.0' }))
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  test('a consumer without requireUnwrap ignores an old contract client version', () => {
    installPackage('@kubb/plugin-fetch', '5.1.2')

    expect(resolveContractClient({ client: 'fetch', plugins: [{ name: 'plugin-fetch' }], root })).toStrictEqual({
      kind: 'contract',
      pluginName: 'plugin-fetch',
    })
  })

  test('requireUnwrap throws when plugin-fetch predates unwrap()', () => {
    installPackage('@kubb/plugin-fetch', '5.1.2')

    expect(() => resolveContractClient({ client: 'fetch', plugins: [{ name: 'plugin-fetch' }], root, requireUnwrap: true })).toThrowError(
      /@kubb\/plugin-fetch.*5\.1\.2.*@kubb\/plugin-fetch@5\.2\.0/s,
    )
  })

  test('requireUnwrap throws when plugin-axios predates unwrap()', () => {
    installPackage('@kubb/plugin-axios', '5.1.0')

    expect(() => resolveContractClient({ client: 'axios', plugins: [{ name: 'plugin-axios' }], root, requireUnwrap: true })).toThrowError(
      /@kubb\/plugin-axios.*5\.1\.0.*@kubb\/plugin-axios@5\.2\.0/s,
    )
  })

  test('requireUnwrap passes when the contract client is new enough', () => {
    installPackage('@kubb/plugin-fetch', '5.2.0')

    expect(resolveContractClient({ client: 'fetch', plugins: [{ name: 'plugin-fetch' }], root, requireUnwrap: true })).toStrictEqual({
      kind: 'contract',
      pluginName: 'plugin-fetch',
    })
  })
})
