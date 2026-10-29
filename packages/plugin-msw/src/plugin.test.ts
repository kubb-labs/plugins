import { createKubb } from 'kubb'
import { defineExtension, kubbContext } from 'kubb/kit'
import { createMockedSetupContext } from '#mocks'
import { describe, expect, test } from 'vitest'
import { pluginMsw } from './plugin.ts'
import type { Options, PluginMsw } from './types.ts'

function setupKubb(options: Options, pluginNames: Array<string>) {
  const plugins = pluginNames.map((name) => defineExtension({ kind: 'plugin', meta: { name } })())

  return createKubb({ input: './petStore.yaml', output: { path: './gen' }, plugins: [...plugins, pluginMsw(options)] }).setup()
}

describe('pluginMsw setup', () => {
  test.each([
    { handlers: false, generators: 1 },
    { handlers: true, generators: 2 },
  ])('registers $generators generator(s) when handlers is $handlers', ({ handlers, generators }) => {
    const plugin = pluginMsw({ handlers })
    const ctx = createMockedSetupContext<PluginMsw>()

    kubbContext.run(ctx, () => plugin.setup?.(plugin.options ?? {}, ctx))

    expect(ctx.addGenerator).toHaveBeenCalledTimes(generators)
  })

  test("parser: 'faker' passes when plugin-faker is registered", async () => {
    await expect(setupKubb({ parser: 'faker' }, ['plugin-ts', 'plugin-faker'])).resolves.toBeUndefined()
  })

  test("parser: 'faker' fails with KUBB_MISSING_DEPENDENCY when plugin-faker is not registered", async () => {
    await expect(setupKubb({ parser: 'faker' }, ['plugin-ts'])).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_MISSING_DEPENDENCY', message: 'Plugin "plugin-faker" is required by "plugin-msw" but not found.' },
    })
  })
})
