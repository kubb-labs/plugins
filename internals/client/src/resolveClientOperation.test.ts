import { ast } from '@internals/ast'
import path from 'node:path'
import { createResolver, Diagnostics, file, withContext } from '@kubb/kit'
import type { Memo, Resolver } from '@kubb/kit'
import { describe, expect, test, vi } from 'vitest'
import { resolveClientOperation } from './resolveClientOperation.ts'

function createTestMemo(): Memo {
  const store = new Map<string, unknown>()
  const memo = (key: string, compute: () => unknown) => {
    if (!store.has(key)) store.set(key, compute())
    return store.get(key)
  }
  return Object.assign(memo, {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => store.set(key, value),
    has: (key: string) => store.has(key),
  }) as Memo
}

// A generator context for a hook plugin that depends on the client plugin. `pluginOptions: undefined` leaves the client plugin out.
function createContext(pluginOptions: Record<string, unknown> | undefined, resolver: Resolver = createResolver({ pluginName: 'plugin-axios' }) as Resolver) {
  const getResolver = vi.fn((_name: string) => resolver)
  const requirePlugin = (name: string) => {
    if (pluginOptions === undefined)
      throw new Diagnostics.Error({ code: Diagnostics.code.pluginNotFound, severity: 'error', message: `Plugin "${name}" not found` })
    return { options: pluginOptions }
  }
  const ctx = {
    root: '/root',
    memo: createTestMemo(),
    schemas: [],
    config: { output: { path: '.' } },
    meta: {},
    plugin: { name: 'plugin-react-query' },
    resolver: createResolver({ pluginName: 'plugin-react-query' }),
    options: { output: { path: '.' } },
    getResolver,
    requirePlugin,
    file: (node: ast.OperationNode, options: object) => withContext(ctx as never, () => file(node, options)),
  }
  return { getResolver, ctx }
}

const run = (ctx: object, node: ast.OperationNode, pluginName = 'plugin-axios') => withContext(ctx as never, () => resolveClientOperation({ node, pluginName }))

describe('resolveClientOperation', () => {
  const getPetById = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })
  const listPets = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

  test('reports a client plugin that is not registered', () => {
    const { ctx } = createContext(undefined)

    expect(() => run(ctx, getPetById)).toThrow(expect.objectContaining({ diagnostic: expect.objectContaining({ code: 'KUBB_PLUGIN_NOT_FOUND' }) }))
  })

  test('reuses the cached result for the same client plugin and node instead of resolving again', () => {
    const { ctx, getResolver } = createContext({ output: { path: '.', mode: 'directory' } })

    const first = run(ctx, getPetById)
    const calls = getResolver.mock.calls.length
    const second = run(ctx, getPetById)

    expect(second).toStrictEqual(first)
    expect(getResolver).toHaveBeenCalledTimes(calls)
  })

  test('resolves independently per client plugin name, even sharing the same memo', () => {
    const { ctx, getResolver } = createContext({ output: { path: '.', mode: 'directory' } })

    run(ctx, getPetById, 'plugin-fetch')
    run(ctx, getPetById, 'plugin-axios')

    expect(getResolver).toHaveBeenCalledWith('plugin-fetch')
    expect(getResolver).toHaveBeenCalledWith('plugin-axios')
  })

  describe("scoped by the client plugin's per-operation options", () => {
    const resolveWith = (pluginOptions: Record<string, unknown>, node: ast.OperationNode) => run(createContext(pluginOptions).ctx, node)

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

    test('falls back to the defaults when the client plugin sets no returnType or importPath', () => {
      const res = resolveWith({ output: { path: '.', mode: 'directory' } }, getPetById)

      expect(res).toMatchObject({ returnType: 'full', clientPath: path.resolve('/root', '.kubb/client.ts'), clientPathIsFile: true, typedHeaders: true })
    })
  })
})
