import type { Config, KubbPluginSetupContext } from 'kubb/kit'
import { describe, expect, test, vi } from 'vitest'
import { pluginMsw } from './plugin.ts'
import type { Options, PluginMsw } from './types.ts'

function setup(options: Options, pluginNames: Array<string>) {
  const plugin = pluginMsw(options)
  const ctx = {
    config: { plugins: pluginNames.map((name) => ({ name })) } as unknown as Config,
    options: {},
    addGenerator: vi.fn(),
    setResolver: vi.fn(),
    addMacro: vi.fn(),
    setMacros: vi.fn(),
    setOptions: vi.fn(),
    injectFile: vi.fn(),
  } as unknown as KubbPluginSetupContext<PluginMsw>

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

    expect(run).toThrow("`@kubb/plugin-msw` needs `@kubb/plugin-faker` for `parser: 'faker'`")
    expect(ctx.addGenerator).not.toHaveBeenCalled()
  })
})
