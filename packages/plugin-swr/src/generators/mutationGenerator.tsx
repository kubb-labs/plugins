import { ast } from '@internals/ast'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, MutationKey, resolveHookFile } from '@internals/tanstack-query'
import { defineGenerator } from '@kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { Mutation } from '../components/Mutation.tsx'
import type { PluginSwr } from '../types'

/**
 * Built-in generator for `useSWRMutation` hooks. Emits one `useFooMutation` hook
 * per POST/PUT/DELETE operation (configurable via `mutation.methods`) plus
 * the matching `fooMutationKey` helper.
 */
export const mutationGenerator = defineGenerator<PluginSwr>({
  name: 'swr-mutation',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { output, query, mutation, client, group } = ctx.options

    const { isMutation } = classifyOperation(node, { query, mutation })

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : 'swr/mutation'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation(node, client.pluginName)
    if (!contractOp) return null

    const mutationHookName = ctx.resolver.mutation.name(node)
    const mutationKeyName = ctx.resolver.mutation.keyName(node)
    const mutationKeyTypeName = ctx.resolver.mutation.keyTypeName(node)
    const mutationArgTypeName = ctx.resolver.mutation.argTypeName(node)

    const hook = resolveHookFile(node, { variant: 'mutation', output, group, contractOp, returnType: ctx.options.returnType })

    return (
      <HookFile hook={hook}>
        <MutationKey name={mutationKeyName} typeName={mutationKeyTypeName} node={node} transformer={ctx.options.mutationKey} />

        {mutation && (
          <>
            <File.Import name={'useSWRMutation'} path={importPath} />
            <File.Import name={['SWRMutationConfiguration']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              clientName={contractOp.name}
              mutationKeyName={mutationKeyName}
              mutationKeyTypeName={mutationKeyTypeName}
              mutationArgTypeName={mutationArgTypeName}
              node={node}
              tsResolver={hook.tsResolver}
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
