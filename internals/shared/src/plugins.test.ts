import { describe, expect, test } from 'vitest'
import { assertOptionValue, assertPluginRegistered } from './plugins.ts'

describe('assertPluginRegistered', () => {
  test('passes when the plugin is registered', () => {
    expect(() =>
      assertPluginRegistered({
        plugins: [{ name: 'plugin-ts' }, { name: 'plugin-zod' }],
        pluginName: 'plugin-zod',
        requiredBy: 'plugin-mcp',
        reason: 'to build schemas',
      }),
    ).not.toThrow()
  })

  test('throws a message naming both plugins when the plugin is missing', () => {
    expect(() =>
      assertPluginRegistered({ plugins: [{ name: 'plugin-ts' }], pluginName: 'plugin-zod', requiredBy: 'plugin-mcp', reason: 'to build schemas' }),
    ).toThrow(
      '`@kubb/plugin-mcp` needs `@kubb/plugin-zod` to build schemas, but `@kubb/plugin-zod` is not registered in `plugins`. Add it to `plugins` in kubb.config.ts.',
    )
  })

  test('throws when no plugins are passed', () => {
    expect(() => assertPluginRegistered({ pluginName: 'plugin-zod', requiredBy: 'plugin-mcp', reason: 'to build schemas' })).toThrow('@kubb/plugin-zod')
  })
})

describe('assertOptionValue', () => {
  test('passes for an allowed value', () => {
    expect(() => assertOptionValue({ pluginName: 'plugin-ts', option: 'syntaxType', value: 'interface', allowed: ['type', 'interface'] })).not.toThrow()
  })

  test('throws a message naming the option and the allowed values', () => {
    expect(() => assertOptionValue({ pluginName: 'plugin-ts', option: 'syntaxType', value: 'bogus', allowed: ['type', 'interface'] })).toThrow(
      "`@kubb/plugin-ts` option `syntaxType` is 'bogus', but it must be one of 'type', 'interface'.",
    )
  })

  test('throws for a non-string value', () => {
    expect(() => assertOptionValue({ pluginName: 'plugin-ts', option: 'arrayType', value: null, allowed: ['array', 'generic'] })).toThrow(
      "`@kubb/plugin-ts` option `arrayType` is null, but it must be one of 'array', 'generic'.",
    )
  })
})
