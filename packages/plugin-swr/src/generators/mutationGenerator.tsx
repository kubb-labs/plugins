import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, MutationKey, resolveHookFile } from '@internals/tanstack-query'
import { ast, defineGenerator } from '@kubb/kit'
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
    if (!ast.isHttpOperationNode(node)) return null
    const { driver, resolver, root } = ctx
    const { output, query, mutation, client, group } = ctx.options

    const { isMutation } = classifyOperation(node, { query, mutation })

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : 'swr/mutation'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, memo: ctx.memo })
    if (!contractOp) return null

    const mutationHookName = resolver.mutation.name(node)
    const mutationKeyName = resolver.mutation.keyName(node)
    const mutationKeyTypeName = resolver.mutation.keyTypeName(node)
    const mutationArgTypeName = resolver.mutation.argTypeName(node)

    const hook = resolveHookFile(node, ctx, { name: mutationHookName, output, group, contractOp })

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
              returnType={contractOp.returnType}
            />
          </>
        )}
      </HookFile>
    )
  },
})
