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

function runSetup(options: Options) {
  const plugin = pluginMsw(options)
  const ctx = createMockedSetupContext<PluginMsw>()

  return kubbContext.run(ctx, () => plugin.setup?.(plugin.options ?? {}, ctx))
}

describe('pluginMsw setup', () => {
  test.each([{ handlers: true, templates: 2 }])('registers $templates templates when handlers is $handlers', ({ handlers, templates }) => {
    const plugin = pluginMsw({ handlers })
    const ctx = createMockedSetupContext<PluginMsw>()

    kubbContext.run(ctx, () => plugin.setup?.(plugin.options ?? {}, ctx))

    expect(registeredTemplates(ctx)).toHaveLength(templates)
  })

  test.each([
    ['a name the handler uses', { 'application/a': { name: 'data', path: '@acme/a' } }, 'the generated handler already uses that name'],
    [
      'one name from two paths',
      { 'application/a': { name: 'encode', path: '@acme/a' }, 'application/b': { name: 'encode', path: '@acme/b' } },
      '"@acme/a" already uses that name',
    ],
  ])('rejects a mediaTypes encoder with %s', (_case, mediaTypes, reason) => {
    expect(() => runSetup({ mediaTypes })).toThrow(reason)
  })

  test('accepts one mediaTypes encoder under two media types', () => {
    const encoder = { name: 'encode', path: '@acme/a' }

    expect(() => runSetup({ mediaTypes: { 'application/a': encoder, 'application/b': encoder } })).not.toThrow()
  })

  test("parser: 'faker' fails with KUBB_MISSING_DEPENDENCY when plugin-faker is not registered", async () => {
    await expect(setupKubb({ parser: 'faker' }, ['plugin-ts'])).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_MISSING_DEPENDENCY', message: 'Plugin "plugin-faker" is required by "plugin-msw" but not found.' },
    })
  })
})
