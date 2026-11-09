import { createKubb } from '@kubb/core'
import { defineExtension } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { pluginFetch } from './plugin.ts'
import type { Options } from './types.ts'

function setupKubb(options: Options, pluginNames: Array<string>) {
  const plugins = pluginNames.map((name) => defineExtension({ kind: 'plugin', meta: { name } })())

  return createKubb({ input: './petStore.yaml', output: { path: './gen' }, plugins: [...plugins, pluginFetch(options)] }).setup()
}

describe('pluginFetch setup', () => {
  test("validator: 'zod' fails with KUBB_MISSING_DEPENDENCY when plugin-zod is not registered", async () => {
    await expect(setupKubb({ validator: 'zod' }, ['plugin-ts'])).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_MISSING_DEPENDENCY', message: 'Plugin "plugin-zod" is required by "plugin-fetch" but not found.' },
    })
  })
})
