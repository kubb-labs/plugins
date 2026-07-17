import { operationFileEntry, resolveOperationTypeImports } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { ast, defineGenerator } from 'kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { Query, QueryKey, QueryOptions } from '../components'
import { classifyOperation } from '../utils.ts'
import type { PluginReactQuery } from '../types'

/**
 * Built-in generator for `useQuery` hooks. Emits one `useFooQuery` hook per
 * GET operation (configurable via `query.methods`) plus the matching
 * `fooQueryKey` / `fooQueryOptions` helpers.
 */
export const queryGenerator = defineGenerator<PluginReactQuery>({
  name: 'react-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, client, group, customOptions, hooks } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const { isQuery, isMutation } = classifyOperation(node, { query, mutation })

    if (!isQuery || isMutation) return null

    const importPath = query ? query.importPath : '@tanstack/react-query'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) return null

    const queryName = resolver.query.name(node)
    const queryOptionsName = resolver.query.optionsName(node)
    const queryKeyName = resolver.query.keyName(node)
    const queryKeyTypeName = resolver.query.keyTypeName(node)

    const meta = {
      file: resolver.file({ ...operationFileEntry(node, queryName), root, output, group: group ?? undefined }),
      fileTs: tsResolver.file({
        ...operationFileEntry(node, node.operationId),
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
    }

    const typeImportGroups = meta.fileTs
      ? resolveOperationTypeImports(node, tsResolver, {
          exclude: [queryKeyTypeName],
          order: 'body-response-first',
          includeParams: false,
          operationTypes: pluginTs.options?.operationTypes,
          operationFilePath: meta.fileTs.path,
          root,
          output: pluginTs.options?.output ?? output,
          group: pluginTs.options?.group ?? undefined,
          extraNames: [tsResolver.response.options(node)],
        })
      : []

    const calledClientName = contractOp.name

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
        footer={resolver.default.footer(ctx.meta, { output, config, file: { path: meta.file.path, baseName: meta.file.baseName } })}
      >
        <File.Import name={[contractOp.name]} root={meta.file.path} path={contractOp.path} />
        <File.Import name={['RequestConfig', 'ResponseErrorConfig']} root={meta.file.path} path={contractOp.clientPath} isTypeOnly />

        {customOptions && <File.Import name={[customOptions.name]} path={customOptions.importPath} />}
        {typeImportGroups.map((typeImport) => (
          <File.Import key={typeImport.path} name={typeImport.names} root={meta.file.path} path={typeImport.path} isTypeOnly />
        ))}

        <QueryKey name={queryKeyName} typeName={queryKeyTypeName} node={node} tsResolver={tsResolver} transformer={ctx.options.queryKey} />

        <File.Import name={['queryOptions']} path={importPath} />

        <QueryOptions name={queryOptionsName} clientName={calledClientName} queryKeyName={queryKeyName} node={node} tsResolver={tsResolver} />

        {query && hooks && (
          <>
            <File.Import name={['useQuery']} path={importPath} />
            <File.Import name={['QueryKey', 'QueryClient', 'QueryObserverOptions', 'UseQueryResult']} path={importPath} isTypeOnly />
            <Query
              name={queryName}
              queryOptionsName={queryOptionsName}
              queryKeyName={queryKeyName}
              queryKeyTypeName={queryKeyTypeName}
              node={node}
              tsResolver={tsResolver}
              customOptions={customOptions}
            />
          </>
        )}
      </File>
    )
  },
})
