import { kubbContext } from 'kubb/kit'
import { createMockedSetupContext } from '#mocks'
import { describe, expect, test } from 'vitest'
import { pluginTs } from './plugin.ts'
import type { Options, PluginTs } from './types.ts'

function setup(options: Options) {
  const plugin = pluginTs(options)
  const ctx = createMockedSetupContext<PluginTs>()

  return { run: () => kubbContext.run(ctx, () => plugin.setup?.(plugin.options ?? {}, ctx)), ctx }
}

describe('pluginTs setup', () => {
  test('accepts the default options and returns them resolved', () => {
    const { run, ctx } = setup({})

    expect(run()).toMatchObject({ output: { path: 'types' }, enum: { type: 'asConst' }, syntaxType: 'type', arrayType: 'array', optionalType: 'questionToken' })
    expect(ctx.addGenerator).toHaveBeenCalledTimes(1)
  })
})
