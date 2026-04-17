import path from 'node:path'

import { ast, defineGenerator } from '@kubb/core'
import { Client, pluginClientName } from '@kubb/plugin-client'
import { pluginTsName } from '@kubb/plugin-ts'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { difference } from 'remeda'
import { Mutation, MutationKey } from '../components'
import type { PluginVueQuery } from '../types'
import { transformName } from '../utils.ts'

export const mutationGenerator = defineGenerator<PluginVueQuery>({
  name: 'vue-query-mutation',
  renderer: jsxRenderer,
  operation(node, ctx) {
    const { adapter, config, driver, resolver, root } = ctx
    const { output, query, mutation, paramsCasing, paramsType, pathParamsType, parser, client: clientOptions, group, transformers } = ctx.options

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs?.resolver) return null
    const tsResolver = pluginTs.resolver

    const isQuery = query === false || (!!query && query.methods.some((method) => node.method.toLowerCase() === method.toLowerCase()))
    const isMutation =
      mutation !== false &&
      !isQuery &&
      difference(mutation ? mutation.methods : [], query ? query.methods : []).some((method) => node.method.toLowerCase() === method.toLowerCase())

    if (!isMutation) return null

    const importPath = mutation ? mutation.importPath : '@tanstack/vue-query'

    const baseName = resolver.resolveName(node.operationId)
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const mutationHookName = transformName(`use${capitalize(baseName)}`, 'function', transformers)
    const mutationTypeName = transformName(`${capitalize(baseName)}`, 'type', transformers)
    const mutationKeyName = transformName(`${baseName}MutationKey`, 'const', transformers)
    const mutationKeyTypeName = transformName(`${capitalize(baseName)}MutationKey`, 'type', transformers)
    const clientName = transformName(baseName, 'function', transformers)

    const meta = {
      file: resolver.resolveFile({ name: mutationHookName, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path }, { root, output, group }),
      fileTs: tsResolver.resolveFile(
        { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
        { root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group },
      ),
    }

    const casedParams = ast.caseParams(node.parameters, paramsCasing)
    const pathParams = casedParams.filter((p) => p.in === 'path')
    const queryParams = casedParams.filter((p) => p.in === 'query')
    const headerParams = casedParams.filter((p) => p.in === 'header')

    const importedTypeNames = [
      node.requestBody?.schema ? tsResolver.resolveDataName(node) : undefined,
      tsResolver.resolveResponseName(node),
      ...pathParams.map((p) => tsResolver.resolvePathParamsName(node, p)),
      ...queryParams.map((p) => tsResolver.resolveQueryParamsName(node, p)),
      ...headerParams.map((p) => tsResolver.resolveHeaderParamsName(node, p)),
      ...node.responses.map((res) => tsResolver.resolveResponseStatusName(node, res.statusCode)),
    ].filter((name): name is string => !!name && name !== mutationKeyTypeName)

    const pluginZodRaw = parser === 'zod' ? driver.getPlugin(pluginZodName) : undefined
    const pluginZod = pluginZodRaw?.name === pluginZodName ? pluginZodRaw : undefined
    const zodResolver = pluginZod?.resolver
    const fileZod = zodResolver
      ? zodResolver.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          { root, output: pluginZod?.options?.output ?? output, group: pluginZod?.options?.group },
        )
      : undefined
    const zodSchemaNames =
      zodResolver && parser === 'zod'
        ? [zodResolver.resolveResponseName?.(node), node.requestBody?.schema ? zodResolver.resolveDataName?.(node) : undefined].filter(Boolean)
        : []

    const clientPlugin = driver.getPlugin(pluginClientName)
    const hasClientPlugin = clientPlugin?.name === pluginClientName
    const shouldUseClientPlugin = hasClientPlugin && clientOptions.clientType !== 'class'

    const clientFile = shouldUseClientPlugin
      ? clientPlugin?.resolver?.resolveFile(
          { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path },
          {
            root,
            output: clientPlugin?.options?.output ?? output,
            group: clientPlugin?.options?.group,
          },
        )
      : undefined

    const resolvedClientName = shouldUseClientPlugin ? (clientPlugin?.resolver?.resolveName(node.operationId) ?? clientName) : clientName

    return (
      <File
        baseName={meta.file.baseName}
        path={meta.file.path}
        meta={meta.file.meta}
        banner={resolver.resolveBanner(adapter.inputNode, { output, config })}
        footer={resolver.resolveFooter(adapter.inputNode, { output, config })}
      >
        {parser === 'zod' && fileZod && zodSchemaNames.length > 0 && (
          <File.Import name={zodSchemaNames as string[]} root={meta.file.path} path={fileZod.path} />
        )}
        {clientOptions.importPath ? (
          <>
            {!shouldUseClientPlugin && <File.Import name={'fetch'} path={clientOptions.importPath} />}
            <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={clientOptions.importPath} isTypeOnly />
            {clientOptions.dataReturnType === 'full' && <File.Import name={['ResponseConfig']} path={clientOptions.importPath} isTypeOnly />}
          </>
        ) : (
          <>
            {!shouldUseClientPlugin && <File.Import name={['fetch']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} />}
            <File.Import
              name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
              root={meta.file.path}
              path={path.resolve(root, '.kubb/fetch.ts')}
              isTypeOnly
            />
            {clientOptions.dataReturnType === 'full' && (
              <File.Import name={['ResponseConfig']} root={meta.file.path} path={path.resolve(root, '.kubb/fetch.ts')} isTypeOnly />
            )}
          </>
        )}
        <File.Import name={['MaybeRefOrGetter']} path="vue" isTypeOnly />
        {shouldUseClientPlugin && clientFile && <File.Import name={[resolvedClientName]} root={meta.file.path} path={clientFile.path} />}
        {!shouldUseClientPlugin && <File.Import name={['buildFormData']} root={meta.file.path} path={path.resolve(root, '.kubb/config.ts')} />}
        {meta.fileTs && importedTypeNames.length > 0 && (
          <File.Import name={Array.from(new Set(importedTypeNames))} root={meta.file.path} path={meta.fileTs.path} isTypeOnly />
        )}

        <MutationKey
          name={mutationKeyName}
          typeName={mutationKeyTypeName}
          node={node}
          pathParamsType={pathParamsType}
          paramsCasing={paramsCasing}
          transformer={ctx.options.mutationKey}
        />

        {!shouldUseClientPlugin && (
          <Client
            name={resolvedClientName}
            baseURL={clientOptions.baseURL}
            dataReturnType={clientOptions.dataReturnType || 'data'}
            paramsCasing={clientOptions.paramsCasing || paramsCasing}
            paramsType={paramsType}
            pathParamsType={pathParamsType}
            parser={parser}
            node={node}
            tsResolver={tsResolver}
            zodResolver={zodResolver}
          />
        )}

        {mutation && (
          <>
            <File.Import name={['useMutation']} path={importPath} />
            <File.Import name={['MutationObserverOptions', 'QueryClient']} path={importPath} isTypeOnly />
            <Mutation
              name={mutationHookName}
              clientName={resolvedClientName}
              typeName={mutationTypeName}
              node={node}
              tsResolver={tsResolver}
              paramsCasing={paramsCasing}
              dataReturnType={clientOptions.dataReturnType || 'data'}
              paramsType={paramsType}
              pathParamsType={pathParamsType}
              mutationKeyName={mutationKeyName}
            />
          </>
        )}
      </File>
    )
  },
})
