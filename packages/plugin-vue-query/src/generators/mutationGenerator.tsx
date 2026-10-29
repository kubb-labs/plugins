import { getRequestGroups } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, MutationKey, resolveHookFile } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Mutation } from '../components/Mutation.tsx'
import type { PluginVueQuery } from '../types'

/**
 * Built-in generator for `useMutation` composables. Emits one
 * `useFooMutation` composable per POST/PUT/DELETE operation (configurable
 * via `mutation.methods`) plus the matching `fooMutationKey` helper.
 */
export const mutationGenerator = defineGenerator<PluginVueQuery>({
  name: 'vue-query-mutation',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { driver, resolver, root } = ctx
    const { output, query, mutation, client, group, hooks } = ctx.options

    const { isMutation } = classifyOperation(node, { query, mutation })

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : '@tanstack/vue-query'

    // The registered contract client plugin owns the `<op>` the composable imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, memo: ctx.memo })
    if (!contractOp) return null

    const mutationHookName = resolver.mutation.name(node)
    const mutationKeyName = resolver.mutation.keyName(node)

    const hook = resolveHookFile(node, ctx, { name: mutationHookName, output, group, contractOp })

    // The contract body unwraps each request group with `toValue()`, so it needs the runtime import.
    const groups = getRequestGroups(node)
    const hasRequestGroups = groups.path || groups.query || groups.body || groups.headers

    return (
      <HookFile
        hook={hook}
        imports={
          <>
            {hasRequestGroups && <File.Import name={['toValue']} path="vue" />}
            <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />
          </>
        }
      >
        <MutationKey name={mutationKeyName} node={node} transformer={ctx.options.mutationKey} />

        {mutation && hooks && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['MutationObserverOptions', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              clientName={contractOp.name}
              node={node}
              tsResolver={hook.tsResolver}
              mutationKeyName={mutationKeyName}
              returnType={contractOp.returnType}
            />
          </>
        )}
      </HookFile>
    )
  },
})
