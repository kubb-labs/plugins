import type { Config } from 'kubb/kit'
import { memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from 'kubb/kit/testing'
import { describe, expect, test } from 'vitest'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { customHookOptionsFileGenerator } from './customHookOptionsFileGenerator.tsx'

const testConfig: Config = {
  root: '.',
  input: {},
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

describe('customHookOptionsFileGenerator operations', () => {
  test('uses the exported custom options function name for barrel metadata', async () => {
    const options: PluginReactQuery['resolvedOptions'] = {
      client: { kind: 'contract', pluginName: 'plugin-axios' },
      queryKey: queryKeyTransformer,
      mutationKey: mutationKeyTransformer,
      query: {
        importPath: '@tanstack/react-query',
        methods: ['GET'],
      },
      mutation: {
        methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
        importPath: '@tanstack/react-query',
      },
      suspense: false,
      infinite: false,
      customOptions: { importPath: './useOptions', name: 'useMyHookOptions' },
      hooks: true,
      exclude: [],
      include: undefined,
      override: [],
      output: { path: '.', mode: 'directory' },
      group: null,
      resolver: resolverReactQuery,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMockedPluginDriver({ name: 'customHookOptions', config: testConfig })

    await renderGeneratorOperations(customHookOptionsFileGenerator, [], {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    const file = driver.fileManager.files.at(0)
    expect(file?.baseName).toBe('useOptions.ts')
    expect(file?.sources).toEqual([
      expect.objectContaining({
        name: 'useMyHookOptions',
        isExportable: true,
        isIndexable: true,
      }),
    ])
  })
})
