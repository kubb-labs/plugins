import { ast, defineGenerator } from 'kubb/kit'
import { jsxRenderer } from 'kubb/jsx'
import { classifyOperation } from '../utils.ts'
import { infiniteQueryGenerator } from './infiniteQueryGenerator.tsx'
import { mutationGenerator } from './mutationGenerator.tsx'
import { queryGenerator } from './queryGenerator.tsx'
import { suspenseInfiniteQueryGenerator } from './suspenseInfiniteQueryGenerator.tsx'
import { suspenseQueryGenerator } from './suspenseQueryGenerator.tsx'
import type { PluginReactQuery } from '../types'

const queryGenerators = [queryGenerator, suspenseQueryGenerator, infiniteQueryGenerator, suspenseInfiniteQueryGenerator]
const mutationGenerators = [mutationGenerator]

/**
 * Classifies each operation once and dispatches only to the generators for its family
 * (query or mutation), instead of running all five hook generators — query, suspenseQuery,
 * infiniteQuery, suspenseInfiniteQuery, mutation — per operation, where four return early.
 */
export const operationGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-operation',
  renderer: jsxRenderer,
  async operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { query, mutation } = ctx.options

    const { isQuery, isMutation } = classifyOperation(node, { query, mutation })
    const generators = isMutation ? mutationGenerators : isQuery ? queryGenerators : []
    if (!generators.length) return null

    const elements = []
    for (const generator of generators) {
      const element = await generator.operation!(node, ctx)
      if (element) elements.push(element)
    }

    return elements.length ? <>{elements}</> : null
  },
})
