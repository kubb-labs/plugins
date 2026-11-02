import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { customHookOptionsFileGenerator } from './customHookOptionsFileGenerator.tsx'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations, testConfig } from '#mocks'

function createOptions(overrides: Partial<PluginReactQuery['resolvedOptions']> = {}): PluginReactQuery['resolvedOptions'] {
  return {
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
    ...overrides,
  }
}

async function renderCustomHookOptionsFile(options: PluginReactQuery['resolvedOptions']) {
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

  return driver.fileManager.files
}

describe('customHookOptionsFileGenerator operations', () => {
  test('uses the exported custom options function name for barrel metadata', async () => {
    const files = await renderCustomHookOptionsFile(createOptions())

    const file = files.at(0)
    expect(file?.baseName).toBe('useOptions.ts')
    expect(file?.sources).toEqual([
      expect.objectContaining({
        name: 'useMyHookOptions',
        isExportable: true,
        isIndexable: true,
      }),
    ])
  })

  test('skips the starter file when hooks are disabled', async () => {
    const files = await renderCustomHookOptionsFile(createOptions({ hooks: false }))

    expect(files).toHaveLength(0)
  })

  test('skips the starter file when importPath resolves outside the output folder', async () => {
    const files = await renderCustomHookOptionsFile(
      createOptions({
        customOptions: { importPath: '../../x', name: 'useMyHookOptions' },
        output: { path: 'hooks', mode: 'directory' },
      }),
    )

    expect(files).toHaveLength(0)
  })

  test('writes the starter file in a subfolder of the output folder', async () => {
    const files = await renderCustomHookOptionsFile(
      createOptions({
        customOptions: { importPath: './custom/useOptions', name: 'useMyHookOptions' },
        output: { path: 'hooks', mode: 'directory' },
      }),
    )

    expect(files).toHaveLength(1)
    expect(files.at(0)?.path).toBe(path.resolve(testConfig.root, testConfig.output.path, 'hooks', 'custom', 'useOptions.ts'))
  })
})
