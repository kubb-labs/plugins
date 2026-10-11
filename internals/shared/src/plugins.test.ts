import { describe, expect, test } from 'vitest'
import { assertPluginRegistered } from './plugins.ts'

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
