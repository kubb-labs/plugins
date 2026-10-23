import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { loadProjectConfig, selectConfig } from './config.ts'

describe('loadProjectConfig', () => {
  let dir = ''

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'openapi-import-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  test('loads kubb.config.ts and hashes it as the identity', async () => {
    await writeFile(path.join(dir, 'kubb.config.ts'), "export default { input: './pet.openapi.yaml', output: { path: './gen' } }\n")
    const config = await loadProjectConfig(path.join(dir))

    expect(config).toMatchObject({ file: path.join(dir, 'kubb.config.ts'), configs: [{ input: './pet.openapi.yaml' }] })
    expect(config.identity).toMatch(/^[0-9a-f]{64}$/)
    expect(config.error).toBeUndefined()
  })

  test('watches kubb.config.ts when there is no config', async () => {
    expect(await loadProjectConfig(dir)).toStrictEqual({ file: path.join(dir, 'kubb.config.ts'), configs: [], identity: 'none' })
  })

  test('reports a config that fails to load', async () => {
    await writeFile(path.join(dir, 'kubb.config.ts'), "throw new Error('broken config')\n")
    const config = await loadProjectConfig(dir)

    expect(config.configs).toStrictEqual([])
    expect(config.error).toContain('broken config')
  })
})

describe('selectConfig', () => {
  const file = '/app/kubb.config.ts'

  test('picks the config whose input is the spec, else the first', () => {
    const pets = { input: './specs/pet.openapi.yaml', output: { path: './gen' } }
    const stores = { input: './specs/store.openapi.yaml', output: { path: './gen' } }

    expect(selectConfig({ file, configs: [pets, stores] }, '/app/specs/store.openapi.yaml')).toBe(stores)
    expect(selectConfig({ file, configs: [pets, stores] }, '/app/other.openapi.yaml')).toBe(pets)
    expect(selectConfig({ file, configs: [] }, '/app/specs/pet.openapi.yaml')).toBeUndefined()
  })
})
