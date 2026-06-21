import path from 'node:path'
import { getOperationParameters, operationFileEntry } from '@internals/shared'
import { camelCase, getRelativePath } from '@internals/utils'
import { ast, defineGenerator } from '@kubb/core'
import type { Generator, PluginFactoryOptions } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { pluginTsName } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { isParserEnabled, resolveQueryParamsParser, resolveRequestParser, resolveResponseParser } from '../builders/parser.ts'
import { SdkClient } from '../components/SdkClient.tsx'
import { SdkFacade } from '../components/SdkFacade.tsx'
import type { Options, ParserOptions, ResolvedOptions, ResolverClient } from '../types.ts'

/**
 * The shape any client plugin (plugin-fetch, plugin-axios) must satisfy to reuse the shared SDK
 * generator. Pins the option, resolved-option, and resolver shapes while leaving the plugin name
 * free.
 */
type ContractClientFactory = PluginFactoryOptions<string, Options, ResolvedOptions, ResolverClient>

type GeneratorContext = Parameters<NonNullable<Generator<ContractClientFactory>['operations']>>[1]

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
  return [tsResolver.resolveRequestConfigName(node), tsResolver.resolveResponsesName(node)]
}

function resolveZodImportNames(node: ast.OperationNode, zodResolver: ResolverZod, parser: ParserOptions): Array<string> {
  const { query: queryParams } = getOperationParameters(node, { paramsCasing: 'original' })
  const names: Array<string | null | undefined> = [
    resolveResponseParser(parser) === 'zod' ? zodResolver.resolveResponseName?.(node) : null,
    resolveRequestParser(parser) === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.resolveDataName?.(node) : null,
    resolveQueryParamsParser(parser) === 'zod' && queryParams.length > 0 ? zodResolver.resolveQueryParamsName?.(node, queryParams[0]!) : null,
  ]
  return names.filter((n): n is string => Boolean(n))
}

/** Turns an absolute file path into a relative module specifier (no extension) from `fromFile`. */
function toModuleSpecifier(fromFile: string, toFile: string): string {
  return getRelativePath(path.dirname(fromFile), toFile).replace(/\.tsx?$/, '')
}

/**
 * Groups operations into one controller per tag. Operations without a tag fall back to a single
 * `Client`/`ApiClient` controller, matching the resolver's default naming.
 */
function buildControllers(nodes: ReadonlyArray<ast.OperationNode>, ctx: GeneratorContext): Array<Controller> {
  const { driver, resolver, root } = ctx
  const { output, group, parser } = ctx.options

  const pluginTs = driver.getPlugin(pluginTsName)!
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

    return { node, name: resolver.resolveName(node.operationId), tsResolver, zodResolver, typeFile, zodFile }
  }

  return nodes.reduce((acc, operationNode) => {
    if (!ast.isHttpOperationNode(operationNode)) return acc
    const tag = operationNode.tags[0]
    const name = tag ? (group?.name?.({ group: camelCase(tag) }) ?? resolver.resolveGroupName(tag)) : resolver.resolveClassName('ApiClient')
    const file = resolver.resolveFile({ name, extname: '.ts', tag }, { root, output, group: group ?? undefined })
    const operationData = buildOperationData(operationNode)
    const previous = acc.find((item) => item.file.path === file.path)

    if (previous) {
      previous.operations.push(operationData)
    } else {
      acc.push({ name, file, operations: [operationData] })
    }

    return acc
  }, [] as Array<Controller>)
}

function collectImportsByFile(ops: Array<OperationData>, pick: (op: OperationData) => { file: ast.FileNode | null; names: Array<string> }) {
  const namesByPath = new Map<string, Set<string>>()
  const filesByPath = new Map<string, ast.FileNode>()

  ops.forEach((op) => {
    const { file, names } = pick(op)
    if (!file || names.length === 0) return
    if (!namesByPath.has(file.path)) namesByPath.set(file.path, new Set())
    const set = namesByPath.get(file.path)!
    names.forEach((n) => set.add(n))
    filesByPath.set(file.path, file)
  })

  return { namesByPath, filesByPath }
}

/**
 * Builds the SDK generator for a client plugin (`@kubb/plugin-fetch`, `@kubb/plugin-axios`).
 *
 * - `sdk.shape: 'class'` emits one instance class per tag whose constructor takes a client config and
 *   builds its own client, so each environment is a separate instance. When `sdk.name` is set, a
 *   composed root class instantiates every tag client from one shared config.
 * - `sdk.shape: 'function'` keeps the standalone functions (emitted by the plugin's own operation
 *   generator) and, when `sdk.name` is set, emits a tree-shakeable `export * as <tag> from './<tag>'`
 *   entry point.
 */
export function createSdkGenerator<TFactory extends ContractClientFactory>(): Generator<TFactory> {
  return defineGenerator<TFactory>({
    name: 'sdk',
    renderer: jsxRenderer,
    operations(nodes, ctx) {
      const { config, resolver, root } = ctx
      const { output, group, parser, sdk } = ctx.options

      const pluginTs = ctx.driver.getPlugin(pluginTsName)
      if (!pluginTs) return null

      const controllers = buildControllers(nodes, ctx)
      const clientPath = path.resolve(root, '.kubb/client.ts')

      const banner = (file: ast.FileNode) => resolver.resolveBanner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })
      const footer = (file: ast.FileNode) => resolver.resolveFooter(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })

      if (sdk.shape === 'function') {
        if (!sdk.name) return null

        const sdkFile = resolver.resolveFile({ name: sdk.name, extname: '.ts' }, { root, output, group: group ?? undefined })

        return (
          <File key={sdkFile.path} baseName={sdkFile.baseName} path={sdkFile.path} meta={sdkFile.meta} banner={banner(sdkFile)} footer={footer(sdkFile)}>
            {controllers.map(({ name, file }) => (
              <File.Export key={name} name={resolver.resolveClientPropertyName(name)} path={toModuleSpecifier(sdkFile.path, path.dirname(file.path))} asAlias />
            ))}
          </File>
        )
      }

      const classFiles = controllers.map(({ name, file, operations: ops }) => {
        const { namesByPath: typeNamesByPath, filesByPath: typeFilesByPath } = collectImportsByFile(ops, (op) => ({
          file: op.typeFile,
          names: resolveTypeImportNames(op.node, op.tsResolver),
        }))
        const { namesByPath: zodNamesByPath, filesByPath: zodFilesByPath } = isParserEnabled(parser)
          ? collectImportsByFile(ops, (op) => ({ file: op.zodFile, names: op.zodResolver ? resolveZodImportNames(op.node, op.zodResolver, parser) : [] }))
          : { namesByPath: new Map<string, Set<string>>(), filesByPath: new Map<string, ast.FileNode>() }

        return (
          <File key={file.path} baseName={file.baseName} path={file.path} meta={file.meta} banner={banner(file)} footer={footer(file)}>
            <File.Import name={['createClient']} root={file.path} path={clientPath} />
            <File.Import name={['ClientConfig', 'ClientInstance', 'Options', 'RequestResult']} root={file.path} path={clientPath} isTypeOnly />

            {parser === 'zod' && ops.some((op) => op.node.requestBody?.content?.[0]?.schema != null) && <File.Import name={['z']} path="zod" isTypeOnly />}

            {Array.from(typeNamesByPath.entries()).map(([filePath, set]) => (
              <File.Import key={filePath} name={Array.from(set)} root={file.path} path={typeFilesByPath.get(filePath)!.path} isTypeOnly />
            ))}

            {isParserEnabled(parser) &&
              Array.from(zodNamesByPath.entries()).map(([filePath, set]) => (
                <File.Import key={filePath} name={Array.from(set)} root={file.path} path={zodFilesByPath.get(filePath)!.path} />
              ))}

            <SdkClient name={name} operations={ops} parser={parser} />
          </File>
        )
      })

      if (!sdk.name) return <>{classFiles}</>

      const sdkFile = resolver.resolveFile({ name: sdk.name, extname: '.ts' }, { root, output, group: group ?? undefined })
      const facadeName = resolver.resolveClassName(sdk.name)
      const members = controllers.map(({ name }) => ({ className: name, propName: resolver.resolveClientPropertyName(name) }))

      return (
        <>
          {classFiles}
          <File key={sdkFile.path} baseName={sdkFile.baseName} path={sdkFile.path} meta={sdkFile.meta} banner={banner(sdkFile)} footer={footer(sdkFile)}>
            <File.Import name={['ClientConfig']} root={sdkFile.path} path={clientPath} isTypeOnly />
            {controllers.map(({ name, file }) => (
              <File.Import key={name} name={[name]} root={sdkFile.path} path={file.path} />
            ))}
            <SdkFacade name={facadeName} members={members} />
          </File>
        </>
      )
    },
  })
}
