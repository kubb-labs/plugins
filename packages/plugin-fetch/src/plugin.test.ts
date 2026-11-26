import { createKubb } from '@kubb/core'
import { defineExtension } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { pluginFetch } from './plugin.ts'
import type { PluginFetchOptions } from './types.ts'

function setupKubb(options: PluginFetchOptions, pluginNames: Array<string>) {
  const plugins = pluginNames.map((name) => defineExtension({ kind: 'plugin', meta: { name } })())

  return createKubb({ input: './petStore.yaml', output: { path: './gen' }, plugins: [...plugins, pluginFetch(options)] }).setup()
}

describe('pluginFetch setup', () => {
  test("validator: 'zod' fails with KUBB_MISSING_DEPENDENCY when plugin-zod is not registered", async () => {
    await expect(setupKubb({ validator: 'zod' }, ['plugin-ts'])).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_MISSING_DEPENDENCY', message: 'Plugin "plugin-zod" is required by "plugin-fetch" but not found.' },
    })
  })

  test("validator: 'valibot' requires plugin-valibot, and not plugin-zod", async () => {
    await expect(setupKubb({ validator: 'valibot' }, ['plugin-ts', 'plugin-zod'])).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_MISSING_DEPENDENCY', message: 'Plugin "plugin-valibot" is required by "plugin-fetch" but not found.' },
    })
    await expect(setupKubb({ validator: 'valibot' }, ['plugin-ts', 'plugin-valibot'])).resolves.toBeUndefined()
  })

  test("returnType: 'plain' is rejected by the Options type", () => {
    // @ts-expect-error 'plain' belongs to plugin-client, the bundled runtime does not typecheck with it
    const options: PluginFetchOptions = { returnType: 'plain' }

    expect(options).toBeDefined()
  })
})
