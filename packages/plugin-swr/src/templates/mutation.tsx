import { ast } from '@internals/ast'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, MutationKey, resolveHookFile } from '@internals/tanstack-query'
import { defineTemplate } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { Mutation } from '../components/Mutation.tsx'
import type { PluginSwr } from '../types'

/**
 * Built-in template for `useSWRMutation` hooks. Emits one `useFoo` hook
 * per POST/PUT/DELETE operation (configurable via `mutation.methods`) plus
 * the matching `fooMutationKey` helper.
 */
export const mutationOperation = defineTemplate<PluginSwr>({
  kind: ast.node.kinds.operation,
  render(node, ctx) {
    if (!ast.http.isOperation(node)) return null
    const { query, mutation, client } = ctx.options

    const { isMutation } = classifyOperation(node, { query, mutation })

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : 'swr/mutation'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ node, pluginName: client.pluginName })
    if (!contractOp) return null

    const mutationHookName = ctx.resolver.mutation.name(node)
    const mutationKeyName = ctx.resolver.mutation.keyName(node)
    const mutationKeyTypeName = ctx.resolver.mutation.keyTypeName(node)
    const mutationArgTypeName = ctx.resolver.mutation.argTypeName(node)

    const hook = resolveHookFile(node, { variant: 'mutation', contractOp, returnType: ctx.options.returnType })

    return (
      <HookFile hook={hook}>
        <MutationKey name={mutationKeyName} typeName={mutationKeyTypeName} node={node} transformer={ctx.options.mutationKey} />

        {mutation && (
          <>
            <File.Import
              names={[
                { name: 'default', alias: 'useSWRMutation', space: 'value' },
                { name: 'SWRMutationConfiguration', space: 'type' },
              ]}
              path={importPath}
            />
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
