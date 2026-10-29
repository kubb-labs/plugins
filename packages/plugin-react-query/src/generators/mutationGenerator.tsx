import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, MutationKey, resolveHookFile } from '@internals/tanstack-query'
import { ast, defineGenerator } from 'kubb/kit'
import { File, jsxRenderer } from 'kubb/jsx'
import { Mutation } from '../components/Mutation.tsx'
import { MutationOptions } from '../components/MutationOptions.tsx'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useMutation` hooks. Emits one `useFooMutation` hook
 * per POST/PUT/DELETE operation (configurable via `mutation.methods`) plus
 * the matching `fooMutationKey` / `fooMutationOptions` helpers.
 */
export const mutationGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query-mutation',
  renderer: jsxRenderer,
  match(node, ctx) {
    const operationNode = node as ast.OperationNode
    if (!ast.isHttpOperationNode(operationNode)) return false
    const { query, mutation } = ctx.options
    return classifyOperation(operationNode, { query, mutation }).isMutation
  },
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { driver, resolver, root } = ctx
    const { output, mutation, client, group, customOptions, hooks } = ctx.options

    const importPath = mutation ? mutation.importPath : '@tanstack/react-query'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output, memo: ctx.memo })
    if (!contractOp) return null

    const mutationHookName = resolver.mutation.name(node)
    const mutationOptionsName = resolver.mutation.optionsName(node)
    const mutationKeyName = resolver.mutation.keyName(node)

    const hook = resolveHookFile(node, ctx, { name: mutationHookName, output, group, contractOp })
    const { tsResolver } = hook

    return (
      <HookFile hook={hook} imports={customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}>
        <MutationKey name={mutationKeyName} node={node} transformer={ctx.options.mutationKey} />

        <File.Import name={['mutationOptions']} path={importPath} />

        <MutationOptions
          name={mutationOptionsName}
          clientName={contractOp.name}
          mutationKeyName={mutationKeyName}
          node={node}
          tsResolver={tsResolver}
          returnType={contractOp.returnType}
        />

        {mutation && hooks && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['UseMutationOptions', 'UseMutationResult', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              mutationOptionsName={mutationOptionsName}
              mutationKeyName={mutationKeyName}
              node={node}
              tsResolver={tsResolver}
              customOptions={customOptions}
            />
          </>
        )}
      </HookFile>
    )
  },
})
