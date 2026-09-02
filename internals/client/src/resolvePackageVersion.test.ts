import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { isVersionAtLeast, resolvePackageVersion } from './resolvePackageVersion.ts'

describe('isVersionAtLeast', () => {
  test('true when equal', () => {
    expect(isVersionAtLeast('5.2.0', '5.2.0')).toBe(true)
  })

  test('true when the patch is newer', () => {
    expect(isVersionAtLeast('5.2.1', '5.2.0')).toBe(true)
  })

  test('true when the minor is newer', () => {
    expect(isVersionAtLeast('5.3.0', '5.2.0')).toBe(true)
  })

  test('false when older', () => {
    expect(isVersionAtLeast('5.1.2', '5.2.0')).toBe(false)
  })

  test('ignores a prerelease suffix', () => {
    expect(isVersionAtLeast('5.2.0-beta.1', '5.2.0')).toBe(true)
  })
})

describe('resolvePackageVersion', () => {
  let root: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-resolve-package-version-'))
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'fixture', version: '0.0.0' }))
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  test('reads the version from an installed package under the given root', () => {
    const pkgDir = path.join(root, 'node_modules', '@kubb', 'plugin-fetch')
    fs.mkdirSync(pkgDir, { recursive: true })
    fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name: '@kubb/plugin-fetch', version: '5.2.0' }))

    expect(resolvePackageVersion('@kubb/plugin-fetch', root)).toBe('5.2.0')
  })

  test('returns undefined when the package is not installed', () => {
    expect(resolvePackageVersion('@kubb-fixture/does-not-exist', root)).toBeUndefined()
  })
})
