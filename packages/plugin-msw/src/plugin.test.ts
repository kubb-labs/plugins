import { createKubb } from '@kubb/core'
import { defineExtension, kubbContext } from '@kubb/kit'
import { createMockedSetupContext, registeredTemplates } from '#mocks'
import { describe, expect, test } from 'vitest'
import { pluginMsw } from './plugin.ts'
import type { PluginMswOptions, PluginMsw } from './types.ts'

function setupKubb(options: PluginMswOptions, pluginNames: Array<string>) {
  const plugins = pluginNames.map((name) => defineExtension({ kind: 'plugin', meta: { name } })())

  return createKubb({ input: './petStore.yaml', output: { path: './gen' }, plugins: [...plugins, pluginMsw(options)] }).setup()
}

describe('pluginMsw setup', () => {
  test.each([{ handlers: true, templates: 2 }])('registers $templates templates when handlers is $handlers', ({ handlers, templates }) => {
    const plugin = pluginMsw({ handlers })
    const ctx = createMockedSetupContext<PluginMsw>()

    kubbContext.run(ctx, () => plugin.setup?.(plugin.options ?? {}, ctx))

    expect(registeredTemplates(ctx)).toHaveLength(templates)
  })

  test("parser: 'faker' fails with KUBB_MISSING_DEPENDENCY when plugin-faker is not registered", async () => {
    await expect(setupKubb({ parser: 'faker' }, ['plugin-ts'])).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_MISSING_DEPENDENCY', message: 'Plugin "plugin-faker" is required by "plugin-msw" but not found.' },
    })
  })
})
