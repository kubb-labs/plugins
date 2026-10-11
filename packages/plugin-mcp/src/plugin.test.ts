import type { Config, KubbPluginSetupContext } from 'kubb/kit'
import { describe, expect, test, vi } from 'vitest'
import { pluginMcp } from './plugin.ts'
import type { PluginMcp } from './types.ts'

function setup(pluginNames: Array<string>) {
  const plugin = pluginMcp()
  const ctx = {
    config: { plugins: pluginNames.map((name) => ({ name })) } as unknown as Config,
    options: {},
    addGenerator: vi.fn(),
    setResolver: vi.fn(),
    addMacro: vi.fn(),
    setMacros: vi.fn(),
    setOptions: vi.fn(),
    injectFile: vi.fn(),
  } as unknown as KubbPluginSetupContext<PluginMcp>

  return { run: () => plugin.hooks?.['kubb:plugin:setup']?.(ctx), ctx }
}

describe('pluginMcp setup', () => {
  test('registers the generators when plugin-zod is registered', () => {
    const { run, ctx } = setup(['plugin-ts', 'plugin-zod', 'plugin-fetch', 'plugin-mcp'])

    run()

    expect(ctx.addGenerator).toHaveBeenCalledTimes(1)
  })

  test('throws when plugin-zod is not registered', () => {
    const { run, ctx } = setup(['plugin-ts', 'plugin-fetch', 'plugin-mcp'])

    expect(run).toThrow('`@kubb/plugin-mcp` needs `@kubb/plugin-zod` to build the tool schemas in `server.ts`')
    expect(ctx.addGenerator).not.toHaveBeenCalled()
  })
})
