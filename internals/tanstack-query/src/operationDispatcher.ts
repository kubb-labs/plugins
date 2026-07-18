import { ast, defineGenerator } from 'kubb/kit'
import { jsxRenderer } from 'kubb/jsx'
import { classifyOperation } from './utils.ts'
import type { Generator, PluginFactoryOptions } from 'kubb/kit'
import type { KubbReactElement } from 'kubb/jsx'
import type { Mutation, Query } from './types.ts'

type OperationDispatcherResolvedOptions = {
  query: Required<Query> | false
  mutation: Required<Mutation> | false
}

/**
 * Builds a single operation generator that classifies each operation as query or mutation once,
 * then renders only the generators for that family. Replaces registering every hook generator
 * (query, suspenseQuery, infiniteQuery, suspenseInfiniteQuery, mutation, ...) directly with the
 * core engine, which would otherwise run all of them per operation with the non-matching ones
 * returning early. No `renderer` is set on the returned generator: each matching generator's
 * JSX result is rendered and upserted directly, so callers stay plain TypeScript.
 */
export function createOperationDispatcher<TOptions extends PluginFactoryOptions<string, object, OperationDispatcherResolvedOptions>>({
  name,
  queryGenerators,
  mutationGenerators,
}: {
  name: string
  queryGenerators: Array<Generator<TOptions>>
  mutationGenerators: Array<Generator<TOptions>>
}): Generator<TOptions> {
  return defineGenerator<TOptions>({
    name,
    async operation(node, ctx) {
      if (!ast.isHttpOperationNode(node)) return null
      const { query, mutation } = ctx.options

      const { isQuery, isMutation } = classifyOperation(node, { query, mutation })
      const family = isMutation ? mutationGenerators : isQuery ? queryGenerators : []

      for (const generator of family) {
        const element = await generator.operation?.(node, ctx)
        if (!element) continue

        using instance = jsxRenderer()
        await instance.render(element as KubbReactElement)
        await ctx.upsertFile(...instance.files)
      }

      return null
    },
  })
}
