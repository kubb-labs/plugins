import { createMockedSetupContext } from 'kubb/kit/testing'
import { describe, expect, test } from 'vitest'
import { pluginMcp } from './plugin.ts'
import type { PluginMcp } from './types.ts'

function setup(pluginNames: Array<string>) {
  const plugin = pluginMcp()
  const ctx = createMockedSetupContext<PluginMcp>({ plugins: pluginNames })

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

    expect(run).toThrow('Plugin "plugin-zod" is required but not found.')
    expect(ctx.addGenerator).not.toHaveBeenCalled()
  })

  test('throws when plugin-ts is not registered', () => {
    const { run, ctx } = setup(['plugin-zod', 'plugin-fetch', 'plugin-mcp'])

    expect(run).toThrow('Plugin "plugin-ts" is required but not found.')
    expect(ctx.addGenerator).not.toHaveBeenCalled()
  })
})
