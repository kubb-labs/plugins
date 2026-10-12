import { createMockedSetupContext } from 'kubb/kit/testing'
import { describe, expect, test } from 'vitest'
import { pluginMsw } from './plugin.ts'
import type { Options, PluginMsw } from './types.ts'

function setup(options: Options, pluginNames: Array<string>) {
  const plugin = pluginMsw(options)
  const ctx = createMockedSetupContext<PluginMsw>({ plugins: pluginNames })

  return { run: () => plugin.hooks?.['kubb:plugin:setup']?.(ctx), ctx }
}

describe('pluginMsw setup', () => {
  test("parser: 'data' does not need plugin-faker", () => {
    const { run, ctx } = setup({ parser: 'data' }, ['plugin-ts', 'plugin-msw'])

    run()

    expect(ctx.addGenerator).toHaveBeenCalledTimes(1)
  })

  test("parser: 'faker' registers the generator when plugin-faker is registered", () => {
    const { run, ctx } = setup({ parser: 'faker' }, ['plugin-ts', 'plugin-faker', 'plugin-msw'])

    run()

    expect(ctx.addGenerator).toHaveBeenCalledTimes(1)
  })

  test("parser: 'faker' throws when plugin-faker is not registered", () => {
    const { run, ctx } = setup({ parser: 'faker' }, ['plugin-ts', 'plugin-msw'])

    expect(run).toThrow('Plugin "plugin-faker" is required but not found.')
    expect(ctx.addGenerator).not.toHaveBeenCalled()
  })

  test('throws when plugin-ts is not registered', () => {
    const { run, ctx } = setup({ parser: 'data' }, ['plugin-msw'])

    expect(run).toThrow('Plugin "plugin-ts" is required but not found.')
    expect(ctx.addGenerator).not.toHaveBeenCalled()
  })
})
