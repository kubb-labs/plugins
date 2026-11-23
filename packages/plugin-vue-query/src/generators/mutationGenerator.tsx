import { ast } from '@internals/ast'
import { requestGroupOrder } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, MutationKey, resolveHookFile } from '@internals/tanstack-query'
import { defineTemplate } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { Mutation } from '../components/Mutation.tsx'
import type { PluginVueQuery } from '../types'

/**
 * Built-in template for `useMutation` composables. Emits one
 * `useFooMutation` composable per POST/PUT/DELETE operation (configurable
 * via `mutation.methods`) plus the matching `fooMutationKey` helper.
 */
export const mutationOperation = defineTemplate<PluginVueQuery>({
  kind: 'Operation',
  render(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { query, mutation, client, hooks } = ctx.options

    const { isMutation } = classifyOperation(node, { query, mutation })

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : '@tanstack/vue-query'

    // The registered contract client plugin owns the `<op>` the composable imports and calls.
    const contractOp = resolveClientOperation({ node, pluginName: client.pluginName })
    if (!contractOp) return null

    const mutationHookName = ctx.resolver.mutation.name(node)
    const mutationKeyName = ctx.resolver.mutation.keyName(node)

    const hook = resolveHookFile(node, { variant: 'mutation', contractOp, returnType: ctx.options.returnType })

    // The contract body unwraps each request group with `toValue()`, so it needs the runtime import.
    const groups = ast.http.getRequestGroups(node)
    const hasRequestGroups = requestGroupOrder.some((key) => groups[key])

    return (
      <HookFile
        hook={hook}
        imports={
          <>
            {hasRequestGroups && <File.Import names={[{ name: 'toValue' }]} path="vue" />}
            <File.Import names={[{ name: 'MaybeRefOrGetter', space: 'type' }]} path="vue" />
          </>
        }
      >
        <MutationKey name={mutationKeyName} node={node} transformer={ctx.options.mutationKey} />

        {mutation && hooks && (
          <>
            <File.Import names={[{ name: 'useMutation' }]} path={importPath} />
            <File.Import
              names={[
                { name: 'MutationObserverOptions', space: 'type' },
                { name: 'QueryClient', space: 'type' },
              ]}
              path={importPath}
            />
            <Mutation
              name={mutationHookName}
              clientName={contractOp.name}
              node={node}
              tsResolver={hook.tsResolver}
              mutationKeyName={mutationKeyName}
              clientReturnType={contractOp.returnType}
              returnType={hook.returnType}
              typedHeaders={hook.contractOp.typedHeaders}
            />
          </>
        )}
      </HookFile>
    )
  },
})
