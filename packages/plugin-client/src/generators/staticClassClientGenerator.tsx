import path from 'node:path'
import { getOperationParameters, operationFileEntry, resolveOperationTypeNames } from '@internals/shared'
import { camelCase } from '@internals/utils'
import { ast, defineGenerator } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { pluginTsName } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { StaticClassClient } from '../components/StaticClassClient'
import type { PluginClient } from '../types'
import { isParserEnabled, resolveQueryParamsParser, resolveRequestParser, resolveResponseParser } from '../utils.ts'

type OperationData = {
  node: ast.OperationNode
  name: string
  tsResolver: ResolverTs
  zodResolver: ResolverZod | null
  typeFile: ast.FileNode
  zodFile: ast.FileNode | null
}

type Controller = {
  name: string
  file: ast.FileNode
  operations: Array<OperationData>
}

function resolveTypeImportNames(node: ast.OperationNode, tsResolver: ResolverTs): Array<string> {
  return resolveOperationTypeNames(node, tsResolver, { order: 'body-response-first' })
}

function resolveZodImportNames(node: ast.OperationNode, zodResolver: ResolverZod, parser: PluginClient['resolvedOptions']['parser']): Array<string> {
  const { query: queryParams } = getOperationParameters(node)
  const names: Array<string | null | undefined> = [
    resolveResponseParser(parser) === 'zod' ? zodResolver.resolveResponseName?.(node) : null,
    resolveRequestParser(parser) === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null,
    resolveQueryParamsParser(parser) === 'zod' && queryParams.length > 0 ? zodResolver.resolveQueryParamsName?.(node, queryParams[0]!) : null,
  ]
  return names.filter((n): n is string => Boolean(n))
}

/**
 * Built-in `operations` generator for `@kubb/plugin-client` when
 * `clientType: 'staticClass'`. Emits one class per tag, with a static method
 * per operation so callers can use `Pet.getPetById(...)` without
 * instantiating the class.
 */
export const staticClassClientGenerator = defineGenerator<PluginClient>({
  name: 'staticClassClient',
  renderer: jsxRenderer,
  operations(nodes, ctx) {
    const { config, driver, resolver, root } = ctx
    const { output, group, dataReturnType, paramsCasing, paramsType, pathParamsType, parser, importPath } = ctx.options
    const baseURL = ctx.options.baseURL ?? ctx.meta.baseURL

    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null

    const tsResolver = driver.getResolver(pluginTsName)
    const tsPluginOptions = pluginTs.options
    const pluginZod = isParserEnabled(parser) ? driver.getPlugin(pluginZodName) : null
    const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null

    function buildOperationData(node: ast.OperationNode): OperationData {
      const typeFile = tsResolver.resolveFile(operationFileEntry(node, node.operationId), {
        root,
        output: tsPluginOptions?.output ?? output,
        group: tsPluginOptions?.group,
      })
      const zodFile =
        zodResolver && pluginZod?.options
          ? zodResolver.resolveFile(operationFileEntry(node, node.operationId), {
              root,
              output: pluginZod.options?.output ?? output,
              group: pluginZod.options?.group ?? undefined,
            })
          : null

      return {
        node: node,
        name: resolver.resolveName(node.operationId),
        tsResolver,
        zodResolver,
        typeFile,
        zodFile,
      }
    }

    const controllers = nodes.reduce((acc, operationNode) => {
      if (!ast.isHttpOperationNode(operationNode)) return acc
      const tag = operationNode.tags[0]
      const groupName = tag ? (group?.name?.({ group: camelCase(tag) }) ?? resolver.resolveGroupName(tag)) : resolver.resolveClassName('Client')

      if (!tag && !group) {
        const name = resolver.resolveClassName('ApiClient')
        const file = resolver.resolveFile({ name, extname: '.ts' }, { root, output, group: group ?? undefined })
        const operationData = buildOperationData(operationNode)
        const previous = acc.find((item) => item.file.path === file.path)

        if (previous) {
          previous.operations.push(operationData)
        } else {
          acc.push({ name, file, operations: [operationData] })
        }
        return acc
      }

      if (tag) {
        const name = groupName
        const file = resolver.resolveFile({ name, extname: '.ts', tag }, { root, output, group: group ?? undefined })
        const operationData = buildOperationData(operationNode)
        const previous = acc.find((item) => item.file.path === file.path)

        if (previous) {
          previous.operations.push(operationData)
        } else {
          acc.push({ name, file, operations: [operationData] })
        }
      }

      return acc
    }, [] as Array<Controller>)

    function collectTypeImports(ops: Array<OperationData>) {
      const typeImportsByFile = new Map<string, Set<string>>()
      const typeFilesByPath = new Map<string, ast.FileNode>()

      ops.forEach((op) => {
        const names = resolveTypeImportNames(op.node, tsResolver)
        if (!typeImportsByFile.has(op.typeFile.path)) {
          typeImportsByFile.set(op.typeFile.path, new Set())
        }
        const imports = typeImportsByFile.get(op.typeFile.path)!
        names.forEach((n) => {
          imports.add(n)
        })
        typeFilesByPath.set(op.typeFile.path, op.typeFile)
      })

      return { typeImportsByFile, typeFilesByPath }
    }

    function collectZodImports(ops: Array<OperationData>) {
      const zodImportsByFile = new Map<string, Set<string>>()
      const zodFilesByPath = new Map<string, ast.FileNode>()

      ops.forEach((op) => {
        if (!op.zodFile || !zodResolver) return
        const names = resolveZodImportNames(op.node, zodResolver, parser)
        if (!zodImportsByFile.has(op.zodFile.path)) {
          zodImportsByFile.set(op.zodFile.path, new Set())
        }
        const imports = zodImportsByFile.get(op.zodFile.path)!
        names.forEach((n) => {
          imports.add(n)
        })
        zodFilesByPath.set(op.zodFile.path, op.zodFile)
      })

      return { zodImportsByFile, zodFilesByPath }
    }

    return (
      <>
        {controllers.map(({ name, file, operations: ops }) => {
          const { typeImportsByFile, typeFilesByPath } = collectTypeImports(ops)
          const { zodImportsByFile, zodFilesByPath } = isParserEnabled(parser)
            ? collectZodImports(ops)
            : { zodImportsByFile: new Map<string, Set<string>>(), zodFilesByPath: new Map<string, ast.FileNode>() }
          const hasFormData = ops.some((op) => op.node.requestBody?.content?.some((e) => e.contentType === 'multipart/form-data') ?? false)

          return (
            <File
              key={file.path}
              baseName={file.baseName}
              path={file.path}
              meta={file.meta}
              banner={resolver.resolveBanner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
              footer={resolver.resolveFooter(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })}
            >
              {importPath ? (
                <>
                  <File.Import name={'client'} path={importPath} />
                  <File.Import name={['mergeConfig']} path={importPath} />
                  <File.Import name={['Client', 'RequestConfig', 'ResponseErrorConfig']} path={importPath} isTypeOnly />
                </>
              ) : (
                <>
                  <File.Import name={['client']} root={file.path} path={path.resolve(root, '.kubb/client.ts')} />
                  <File.Import name={['mergeConfig']} root={file.path} path={path.resolve(root, '.kubb/client.ts')} />
                  <File.Import
                    name={['Client', 'RequestConfig', 'ResponseErrorConfig']}
                    root={file.path}
                    path={path.resolve(root, '.kubb/client.ts')}
                    isTypeOnly
                  />
                </>
              )}

              {hasFormData && <File.Import name={['buildFormData']} root={file.path} path={path.resolve(root, '.kubb/config.ts')} />}

              {Array.from(typeImportsByFile.entries()).map(([filePath, importSet]) => {
                const typeFile = typeFilesByPath.get(filePath)
                if (!typeFile) return null
                const importNames = Array.from(importSet).filter(Boolean)
                if (importNames.length === 0) return null
                return <File.Import key={filePath} name={importNames} root={file.path} path={typeFile.path} isTypeOnly />
              })}

              {isParserEnabled(parser) &&
                Array.from(zodImportsByFile.entries()).map(([filePath, importSet]) => {
                  const zodFile = zodFilesByPath.get(filePath)
                  if (!zodFile) return null
                  const importNames = Array.from(importSet).filter(Boolean)
                  if (importNames.length === 0) return null
                  return <File.Import key={filePath} name={importNames} root={file.path} path={zodFile.path} />
                })}

              <StaticClassClient
                name={name}
                operations={ops}
                baseURL={baseURL}
                dataReturnType={dataReturnType}
                pathParamsType={pathParamsType}
                paramsCasing={paramsCasing}
                paramsType={paramsType}
                parser={parser}
              />
            </File>
          )
        })}
      </>
    )
  },
})
