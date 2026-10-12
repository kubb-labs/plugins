import { createMockedSetupContext } from 'kubb/kit/testing'
import { describe, expect, test } from 'vitest'
import { pluginTs } from './plugin.ts'
import type { Options, PluginTs } from './types.ts'

function setup(options: Options) {
  const plugin = pluginTs(options)
  const ctx = createMockedSetupContext<PluginTs>()

  return { run: () => plugin.hooks?.['kubb:plugin:setup']?.(ctx), ctx }
}

describe('pluginTs setup', () => {
  test('accepts the default options', () => {
    const { run, ctx } = setup({})

    run()

    expect(ctx.addGenerator).toHaveBeenCalledTimes(1)
  })

  test('accepts every documented value', () => {
    const { run } = setup({ enum: { type: 'inlineLiteral' }, syntaxType: 'interface', arrayType: 'generic', optionalType: 'questionTokenAndUndefined' })

    expect(run).not.toThrow()
  })

  test.each([
    { option: 'enum.type', options: { enum: { type: 'bogus' } }, allowed: '"asConst", "enum", "constEnum", "literal", "inlineLiteral"' },
    { option: 'syntaxType', options: { syntaxType: 'bogus' }, allowed: '"type", "interface"' },
    { option: 'arrayType', options: { arrayType: 'bogus' }, allowed: '"array", "generic"' },
    { option: 'optionalType', options: { optionalType: 'bogus' }, allowed: '"questionToken", "undefined", "questionTokenAndUndefined"' },
  ])('throws on an invalid $option', ({ option, options, allowed }) => {
    const { run, ctx } = setup(options as unknown as Options)

    expect(run).toThrow(`Plugin "plugin-ts" option \`${option}\` is "bogus", but it must be one of ${allowed}.`)
    expect(ctx.setOptions).not.toHaveBeenCalled()
  })

  test('throws on an invalid value inside an override', () => {
    const { run, ctx } = setup({ override: [{ type: 'operationId', pattern: 'listPets', options: { syntaxType: 'bogus' } }] } as unknown as Options)

    expect(run).toThrow('Plugin "plugin-ts" option `override[0].options.syntaxType` is "bogus", but it must be one of "type", "interface".')
    expect(ctx.setOptions).not.toHaveBeenCalled()
  })

  test('accepts an override that leaves the enum-like options out', () => {
    const { run } = setup({ override: [{ type: 'operationId', pattern: 'listPets', options: { enum: { type: 'literal' } } }] } as unknown as Options)

    expect(run).not.toThrow()
  })
})
