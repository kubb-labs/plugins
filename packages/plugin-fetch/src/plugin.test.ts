import type { KubbPluginSetupContext } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import { pluginFetch, pluginFetchName } from './plugin.ts'

function setupContext() {
  const injectFile = vi.fn()
  const ctx = {
    config: { root: '.', output: { path: 'src/gen' } },
    injectFile,
    setOptions: vi.fn(),
    setResolver: vi.fn(),
    setMacros: vi.fn(),
    addGenerator: vi.fn(),
  } as unknown as KubbPluginSetupContext
  return { ctx, injectFile }
}

function runSetup(plugin: ReturnType<typeof pluginFetch>, ctx: KubbPluginSetupContext) {
  const setup = plugin.hooks?.['kubb:plugin:setup']
  if (!setup) throw new Error('missing setup hook')
  return setup.call(plugin, ctx)
}

function injectedSource(injectFile: ReturnType<typeof vi.fn>): string {
  const sources = injectFile.mock.calls[0]![0].sources as Array<{ nodes: Array<{ value?: string }> }>
  return sources.flatMap((source) => source.nodes.map((node) => node.value ?? '')).join('')
}

describe('pluginFetch', () => {
  it('depends on plugin-ts and only on plugin-zod when a parser is enabled', () => {
    expect(pluginFetch({}).dependencies).toStrictEqual(['plugin-ts'])
    expect(pluginFetch({ parser: 'zod' }).dependencies).toStrictEqual(['plugin-ts', 'plugin-zod'])
  })

  it('injects the bundled runtime into .kubb/client.ts', () => {
    const plugin = pluginFetch({})
    const { ctx, injectFile } = setupContext()
    runSetup(plugin, ctx)

    expect(injectFile).toHaveBeenCalledTimes(1)
    const file = injectFile.mock.calls[0]![0]
    expect(file.path).toContain('.kubb/client.ts')
    const source = injectedSource(injectFile)
    expect(source).toContain('createClientCore')
    expect(source).toContain('defaultTransport')
    expect(source).not.toContain('@ts-nocheck')
  })

  it('wires an explicit baseURL into the client config', () => {
    const plugin = pluginFetch({ baseURL: 'https://api.test' })
    const { ctx, injectFile } = setupContext()
    runSetup(plugin, ctx)

    expect(injectedSource(injectFile)).toContain('client.setConfig({ baseURL: "https://api.test" })')
  })

  it('registers the default macros plus any user macros', () => {
    const plugin = pluginFetch({})
    const { ctx } = setupContext()
    runSetup(plugin, ctx)

    expect(ctx.setMacros).toHaveBeenCalledTimes(1)
    expect((ctx.setMacros as ReturnType<typeof vi.fn>).mock.calls[0]![0].length).toBeGreaterThanOrEqual(1)
  })

  it('uses the canonical plugin name', () => {
    expect(pluginFetch({}).name).toBe(pluginFetchName)
  })
})
