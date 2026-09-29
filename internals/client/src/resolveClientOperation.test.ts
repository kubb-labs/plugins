import path from 'node:path'
import { ast, createResolver } from 'kubb/kit'
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

  // A real resolver, so the client plugin's filters go through Kubb's own `resolver.default.options`.
  describe("scoped by the client plugin's per-operation options", () => {
    const getPetById = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
    const listPets = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    function resolveWith(pluginOptions: Record<string, unknown>, node: ast.OperationNode) {
      const resolver = createResolver({ pluginName: 'plugin-axios' }) as unknown as Resolver
      const driver = { getPlugin: () => ({ options: pluginOptions }), getResolver: () => resolver }

      return resolveClientOperation({
        clientPlugin: { pluginName: 'plugin-axios' },
        driver,
        node,
        root: '/root',
        output: { path: '.', mode: 'directory' },
        cache: createTestCache(),
      })
    }

    const returnTypeOverride = {
      output: { path: './clients', mode: 'directory' },
      returnType: 'data',
      override: [{ type: 'operationId', pattern: 'getPetById', options: { returnType: 'full' } }],
    }

    test('applies an override returnType to the operation it matches', () => {
      expect(resolveWith(returnTypeOverride, getPetById)?.returnType).toBe('full')
    })

    test('keeps the global returnType for operations an override does not match', () => {
      expect(resolveWith(returnTypeOverride, listPets)?.returnType).toBe('data')
    })

    test('imports from the output path an override moves the operation to', () => {
      const moved = {
        output: { path: './clients', mode: 'directory' },
        override: [{ type: 'operationId', pattern: 'getPetById', options: { output: { path: './admin', mode: 'directory' } } }],
      }

      expect(resolveWith(moved, getPetById)?.path).toBe(path.resolve('/root', 'admin', 'getPetById.ts'))
      expect(resolveWith(moved, listPets)?.path).toBe(path.resolve('/root', 'clients', 'listPets.ts'))
    })

    test('returns null for an operation the client plugin excludes, since it emits no <op>', () => {
      const options = { output: { path: '.', mode: 'directory' }, exclude: [{ type: 'operationId', pattern: 'getPetById' }] }

      expect(resolveWith(options, getPetById)).toBeNull()
      expect(resolveWith(options, listPets)).not.toBeNull()
    })

    test('returns null for an operation outside the client plugin include', () => {
      const options = { output: { path: '.', mode: 'directory' }, include: [{ type: 'operationId', pattern: 'listPets' }] }

      expect(resolveWith(options, getPetById)).toBeNull()
      expect(resolveWith(options, listPets)).not.toBeNull()
    })

    test('applies an override matching by path pattern', () => {
      const pathOverride = {
        output: { path: './clients', mode: 'directory' },
        returnType: 'data',
        override: [{ type: 'path', pattern: '/pets/.*', options: { returnType: 'full' } }],
      }

      expect(resolveWith(pathOverride, getPetById)?.returnType).toBe('full')
      expect(resolveWith(pathOverride, listPets)?.returnType).toBe('data')
    })

    test('applies an override matching by HTTP method', () => {
      const createPet = ast.factory.createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })
      const methodOverride = {
        output: { path: './clients', mode: 'directory' },
        returnType: 'data',
        override: [{ type: 'method', pattern: 'post', options: { returnType: 'full' } }],
      }

      expect(resolveWith(methodOverride, createPet)?.returnType).toBe('full')
      expect(resolveWith(methodOverride, listPets)?.returnType).toBe('data')
    })

    test('applies an override matching by OpenAPI tag', () => {
      const taggedPet = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}', tags: ['admin'] })
      const untaggedPet = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets', tags: ['public'] })
      const tagOverride = {
        output: { path: './clients', mode: 'directory' },
        returnType: 'data',
        override: [{ type: 'tag', pattern: 'admin', options: { returnType: 'full' } }],
      }

      expect(resolveWith(tagOverride, taggedPet)?.returnType).toBe('full')
      expect(resolveWith(tagOverride, untaggedPet)?.returnType).toBe('data')
    })

    test('gives precedence to the first matching override rule', () => {
      const taggedPet = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}', tags: ['pets'] })
      const multiOverride = {
        output: { path: './clients', mode: 'directory' },
        override: [
          { type: 'tag', pattern: 'pets', options: { returnType: 'full' } },
          { type: 'operationId', pattern: 'getPetById', options: { returnType: 'data' } },
        ],
      }

      expect(resolveWith(multiOverride, taggedPet)?.returnType).toBe('full')
    })

    test('exclude takes precedence over include when an operation matches both', () => {
      const taggedPet = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}', tags: ['pets'] })
      const otherTaggedPet = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets', tags: ['pets'] })
      const conflictConfig = {
        output: { path: '.', mode: 'directory' },
        include: [{ type: 'tag', pattern: 'pets' }],
        exclude: [{ type: 'operationId', pattern: 'getPetById' }],
      }

      expect(resolveWith(conflictConfig, taggedPet)).toBeNull()
      expect(resolveWith(conflictConfig, otherTaggedPet)).not.toBeNull()
    })

    test('falls back to plugin options when resolver has no default property', () => {
      const customResolver = {
        file: vi.fn(({ root, output }) => ({ path: path.resolve(root, output.path, 'custom.ts') })),
        name: vi.fn(() => 'customOp'),
      } as unknown as Resolver
      const driver = { getPlugin: () => ({ options: { returnType: 'data' as const } }), getResolver: () => customResolver }

      const res = resolveClientOperation({
        clientPlugin: { pluginName: 'plugin-custom' },
        driver,
        node: getPetById,
        root: '/root',
        output: { path: '.', mode: 'directory' },
        cache: createTestCache(),
      })

      expect(res?.returnType).toBe('data')
      expect(res?.name).toBe('customOp')
    })

    test('handles missing plugin options gracefully', () => {
      const resolver = createResolver({ pluginName: 'plugin-axios' }) as unknown as Resolver
      const driver = { getPlugin: () => undefined, getResolver: () => resolver }

      const res = resolveClientOperation({
        clientPlugin: { pluginName: 'plugin-axios' },
        driver,
        node: getPetById,
        root: '/root',
        output: { path: '.', mode: 'directory' },
        cache: createTestCache(),
      })

      expect(res?.returnType).toBe('full')
    })
  })
})
