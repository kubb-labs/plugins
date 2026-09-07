import { ast } from 'kubb/kit'
import type { NodeCache, Resolver } from 'kubb/kit'
import { describe, expect, test, vi } from 'vitest'
import { resolveClientOperation } from './resolveClientOperation.ts'

function createTestCache(): NodeCache {
  const store = new Map<string, unknown>()
  return {
    readItem<TValue>(key: string) {
      return store.get(key) as TValue | undefined
    },
    writeItem<TValue>(key: string, value: TValue) {
      store.set(key, value)
      return value
    },
    ensureItem<TValue>(key: string, factory: () => TValue) {
      if (store.has(key)) return store.get(key) as TValue
      const value = factory()
      store.set(key, value)
      return value
    },
  }
}

function createDriver() {
  const getResolver = vi.fn(
    () =>
      ({
        file: () => ast.factory.createFile({ path: '/root/getPetById.ts', baseName: 'getPetById.ts' as const }),
        name: (name: string) => name,
      }) as unknown as Resolver,
  )
  const getPlugin = vi.fn(() => ({ options: {} }))
  return { getPlugin, getResolver }
}

describe('resolveClientOperation', () => {
  test('returns null when no contract client plugin is registered', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()

    const result = resolveClientOperation({ clientPlugin: null, driver, node, root: '/root', output: { path: '.' }, cache: createTestCache() })

    expect(result).toBeNull()
    expect(driver.getResolver).not.toHaveBeenCalled()
  })

  test('resolves the operation name, file path, and client runtime path', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()

    const result = resolveClientOperation({
      clientPlugin: { pluginName: 'plugin-fetch' },
      driver,
      node,
      root: '/root',
      output: { path: '.' },
      cache: createTestCache(),
    })

    expect(result).toStrictEqual({ name: 'getPetById', path: '/root/getPetById.ts', clientPath: '/root/.kubb/client.ts', returnType: 'full' })
  })

  test("reads the client plugin's returnType, defaulting to 'full' when unset", () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    driver.getPlugin.mockReturnValueOnce({ options: { returnType: 'data' } })

    const result = resolveClientOperation({
      clientPlugin: { pluginName: 'plugin-fetch' },
      driver,
      node,
      root: '/root',
      output: { path: '.' },
      cache: createTestCache(),
    })

    expect(result?.returnType).toBe('data')
  })

  test('reuses the cached result for the same client plugin and node instead of resolving again', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    const cache = createTestCache()

    const first = resolveClientOperation({ clientPlugin: { pluginName: 'plugin-fetch' }, driver, node, root: '/root', output: { path: '.' }, cache })
    const second = resolveClientOperation({ clientPlugin: { pluginName: 'plugin-fetch' }, driver, node, root: '/root', output: { path: '.' }, cache })

    expect(second).toStrictEqual(first)
    expect(driver.getResolver).toHaveBeenCalledOnce()
  })

  test('resolves independently per client plugin name, even sharing the same cache', () => {
    const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const driver = createDriver()
    const cache = createTestCache()

    resolveClientOperation({ clientPlugin: { pluginName: 'plugin-fetch' }, driver, node, root: '/root', output: { path: '.' }, cache })
    resolveClientOperation({ clientPlugin: { pluginName: 'plugin-axios' }, driver, node, root: '/root', output: { path: '.' }, cache })

    expect(driver.getResolver).toHaveBeenCalledTimes(2)
    expect(driver.getResolver).toHaveBeenNthCalledWith(1, 'plugin-fetch')
    expect(driver.getResolver).toHaveBeenNthCalledWith(2, 'plugin-axios')
  })
})
