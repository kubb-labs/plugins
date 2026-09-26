import type { Config } from 'kubb/kit'
import { memoryStorage } from 'kubb/kit'
import { createMockedAdapter } from 'kubb/kit/testing'
import { describe, expect, test, vi } from 'vitest'
import { pluginMcp } from './plugin.ts'

const baseConfig: Config = {
  root: '.',
  input: '',
  output: { path: 'test' },
  plugins: [{ name: 'plugin-axios', hooks: {} }],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

function createSetupCtx(config: Config = baseConfig) {
  return {
    config,
    options: {},
    addGenerator: vi.fn(),
    setResolver: vi.fn(),
    addMacro: vi.fn(),
    setMacros: vi.fn(),
    setOptions: vi.fn(),
    injectFile: vi.fn(),
  }
}

describe('pluginMcp — output.mode validation', () => {
  test('throws when `output.mode: "file"` is set explicitly', () => {
    const plugin = pluginMcp({ output: { path: 'mcp', mode: 'file' } })
    const ctx = createSetupCtx()

    expect(() => plugin.hooks['kubb:plugin:setup']?.(ctx as never)).toThrow(/does not support/)
  })

  test('throws when `output.mode` is inferred as "file" from an extension in `output.path`', () => {
    const plugin = pluginMcp({ output: { path: 'mcp.ts' } })
    const ctx = createSetupCtx()

    expect(() => plugin.hooks['kubb:plugin:setup']?.(ctx as never)).toThrow(/does not support/)
  })

  test('does not throw for the default directory output', () => {
    const plugin = pluginMcp({})
    const ctx = createSetupCtx()

    expect(() => plugin.hooks['kubb:plugin:setup']?.(ctx as never)).not.toThrow()
    expect(ctx.setOptions).toHaveBeenCalled()
  })

  test('does not throw for an explicit `output.mode: "directory"`', () => {
    const plugin = pluginMcp({ output: { path: 'mcp', mode: 'directory' } })
    const ctx = createSetupCtx()

    expect(() => plugin.hooks['kubb:plugin:setup']?.(ctx as never)).not.toThrow()
    expect(ctx.setOptions).toHaveBeenCalled()
  })
})
