import { createKubb } from '@kubb/core'
import { defineExtension } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { pluginMcp } from './plugin.ts'

function setupKubb(pluginNames: Array<string>) {
  const plugins = pluginNames.map((name) => defineExtension({ kind: 'plugin', meta: { name } })())

  return createKubb({ input: './petStore.yaml', output: { path: './gen' }, plugins: [...plugins, pluginMcp()] }).setup()
}

describe('pluginMcp setup', () => {
  test('passes when plugin-ts and plugin-zod are registered', async () => {
    await expect(setupKubb(['plugin-ts', 'plugin-zod', 'plugin-fetch'])).resolves.toBeUndefined()
  })

  test('passes without plugin-ts, since pluginZod({ inferred }) can supply the handler types', async () => {
    await expect(setupKubb(['plugin-zod', 'plugin-fetch'])).resolves.toBeUndefined()
  })

  test('fails with KUBB_MISSING_DEPENDENCY when plugin-zod is not registered', async () => {
    await expect(setupKubb(['plugin-ts', 'plugin-fetch'])).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_MISSING_DEPENDENCY', message: 'Plugin "plugin-zod" is required by "plugin-mcp" but not found.' },
    })
  })
})
