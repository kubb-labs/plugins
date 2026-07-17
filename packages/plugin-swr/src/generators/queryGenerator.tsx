import { resolveOperationTypeImports } from '@internals/shared'
import { resolveClientOperation } from '@internals/client'
import { classifyOperation } from '@internals/tanstack-query'
import { ast, defineGenerator } from 'kubb/kit'
import { defaultOperationTypes, pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { Query, QueryKey, QueryOptions } from '../components'
import type { PluginSwr } from '../types'

/**
 * Built-in generator for `useSWR` hooks. Emits one `useFoo` hook per read operation plus the
 * matching `fooQueryKey` helper and `fooQueryOptions` factory.
 */
export const queryGenerator = defineGenerator<PluginSwr>({
  name: 'swr-query',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node)) return null
    const { config, driver, resolver, root } = ctx
    const { output, query, mutation, client, group } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null
    const tsResolver = driver.getResolver(pluginTsName)

    const { isQuery } = classifyOperation(node, { query, mutation })

    if (!isQuery) return null

    const importPath = query ? query.importPath : 'swr'

    // The registered contract client plugin owns the `<op>` the hook imports and calls.
    const contractOp = resolveClientOperation({ clientPlugin: { pluginName: client.pluginName }, driver, node, root, output })
    if (!contractOp) return null

    const queryName = resolver.query.name(node)
    const queryOptionsName = resolver.query.optionsName(node)
    const queryKeyName = resolver.query.keyName(node)
    const queryKeyTypeName = resolver.query.keyTypeName(node)

    const meta = {
      file: resolver.file({ name: queryName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path, root, output, group }),
      fileTs: tsResolver.file({
        name: node.operationId,
        extname: '.ts',
        tag: node.tags[0] ?? 'default',
        path: node.path,
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group,
      }),
    }

    const typeImportGroups = meta.fileTs
      ? resolveOperationTypeImports(node, tsResolver, {
          exclude: [queryKeyTypeName],
          order: 'body-response-first',
          includeParams: false,
          operationTypes: pluginTs.options?.operationTypes ?? defaultOperationTypes,
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

        {typeImportGroups.map((typeImport) => (
          <File.Import key={typeImport.path} name={typeImport.names} root={meta.file.path} path={typeImport.path} isTypeOnly />
        ))}

        <QueryKey name={queryKeyName} typeName={queryKeyTypeName} node={node} tsResolver={tsResolver} transformer={ctx.options.queryKey} />

        <QueryOptions name={queryOptionsName} clientName={calledClientName} node={node} tsResolver={tsResolver} />

        {query && (
          <>
            <File.Import name={'useSWR'} path={importPath} />
            <File.Import name={['SWRConfiguration']} path={importPath} isTypeOnly />
            <Query
              name={queryName}
              queryOptionsName={queryOptionsName}
              queryKeyName={queryKeyName}
              queryKeyTypeName={queryKeyTypeName}
              node={node}
              tsResolver={tsResolver}
            />
          </>
        )}
      </File>
    )
  },
})
