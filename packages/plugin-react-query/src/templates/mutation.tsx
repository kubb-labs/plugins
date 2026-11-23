import { ast } from '@internals/ast'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation, HookFile, MutationKey, resolveHookFile } from '@internals/tanstack-query'
import { defineTemplate } from '@kubb/kit'
import type { TemplateContext } from '@kubb/kit'
import { File } from '@kubb/renderer-jsx'
import { Mutation } from '../components/Mutation.tsx'
import { MutationOptions } from '../components/MutationOptions.tsx'
import type { PluginReactQuery } from '../types'

// The operations this template writes. Every other operation returns `null`.
function matchesMutation(node: ast.OperationNode, ctx: TemplateContext<PluginReactQuery>): boolean {
  if (!ast.http.isOperation(node)) return false
  const { query, mutation } = ctx.options
  return classifyOperation(node, { query, mutation }).isMutation
}

/**
 * Built-in template for `useMutation` hooks. Emits one `useFooMutation` hook
 * per POST/PUT/DELETE operation (configurable via `mutation.methods`) plus
 * the matching `fooMutationKey` / `fooMutationOptions` helpers.
 */
export const mutationOperation = defineTemplate<PluginReactQuery>({
  kind: ast.node.kinds.operation,
  render(node, ctx) {
    if (!matchesMutation(node, ctx)) return null
    if (!ast.http.isOperation(node)) return null
    const { mutation, client, customOptions, hooks } = ctx.options

    const importPath = mutation ? mutation.importPath : '@tanstack/react-query'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ node, pluginName: client.pluginName })
    if (!contractOp) return null

    const mutationHookName = ctx.resolver.mutation.name(node)
    const mutationOptionsName = ctx.resolver.mutation.optionsName(node)
    const mutationKeyName = ctx.resolver.mutation.keyName(node)

    const hook = resolveHookFile(node, { variant: 'mutation', contractOp, returnType: ctx.options.returnType })
    const { tsResolver } = hook

    return (
      <HookFile hook={hook} imports={customOptions && <File.Import names={[{ name: customOptions.name, space: 'value' }]} path={customOptions.importPath} />}>
        <MutationKey name={mutationKeyName} node={node} transformer={ctx.options.mutationKey} />

        <File.Import names={[{ name: 'mutationOptions', space: 'value' }]} path={importPath} />

        <MutationOptions
          name={mutationOptionsName}
          clientName={contractOp.name}
          mutationKeyName={mutationKeyName}
          node={node}
          tsResolver={tsResolver}
          clientReturnType={contractOp.returnType}
          returnType={hook.returnType}
          typedHeaders={hook.contractOp.typedHeaders}
        />

        {mutation && hooks && (
          <>
            <File.Import
              names={[
                { name: 'useMutation', space: 'value' },
                { name: 'UseMutationOptions', space: 'type' },
                { name: 'UseMutationResult', space: 'type' },
                { name: 'QueryClient', space: 'type' },
              ]}
              path={importPath}
            />
            <Mutation
              name={mutationHookName}
              mutationOptionsName={mutationOptionsName}
              mutationKeyName={mutationKeyName}
              node={node}
              tsResolver={tsResolver}
              customOptions={customOptions}
              returnType={hook.returnType}
              typedHeaders={hook.contractOp.typedHeaders}
            />
          </>
        )}
      </HookFile>
    )
  },
})
