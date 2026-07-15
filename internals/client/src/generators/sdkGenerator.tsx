import path from 'node:path'
import { getOperationParameters, operationFileEntry } from '@internals/shared'
import { camelCase } from '@internals/utils'
import { ast, defineGenerator } from 'kubb/kit'
import type { Generator } from 'kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { pluginTsName } from '@kubb/plugin-ts'
import type { ResolverZod } from '@kubb/plugin-zod'
import { pluginZodName } from '@kubb/plugin-zod'
import { File, jsxRenderer } from 'kubb/jsx'
import {
  buildZodErrorParse,
  isValidatorEnabled,
  resolveQueryParamsValidator,
  resolveRequestValidator,
  resolveResponseValidator,
} from '../builders/validatorOptions.ts'
import { type Auth, getOperationSecurity, type SecurityDocument } from '../builders/security.ts'
import { SdkClient } from '../components/SdkClient.tsx'
import { SdkFacade } from '../components/SdkFacade.tsx'
import type { ContractClientFactory, ValidatorOptions } from '../types.ts'

type GeneratorContext = Parameters<NonNullable<Generator<ContractClientFactory>['operations']>>[1]

type OperationData = {
  node: ast.OperationNode
  name: string
  tsResolver: ResolverTs
  zodResolver: ResolverZod | null
  typeFile: ast.FileNode
  zodFile: ast.FileNode | null
  security?: Array<Auth>
}

type Controller = {
  name: string
  tag: string | undefined
  file: ast.FileNode
  operations: Array<OperationData>
}

function resolveTypeImportNames(node: ast.OperationNode, tsResolver: ResolverTs): Array<string> {
  return [tsResolver.response.options(node), tsResolver.response.responses(node)]
}

function resolveZodImportNames(node: ast.OperationNode, zodResolver: ResolverZod, validator: ValidatorOptions): Array<string> {
  const { query: queryParams } = getOperationParameters(node)
  const names: Array<string | null | undefined> = [
    resolveResponseValidator(validator) === 'zod' ? zodResolver.response.response(node) : null,
    resolveResponseValidator(validator) === 'zod' ? (buildZodErrorParse(node, zodResolver)?.expression ?? null) : null,
    resolveRequestValidator(validator) === 'zod' && node.requestBody?.content?.[0]?.schema ? zodResolver.response.body(node) : null,
    resolveQueryParamsValidator(validator) === 'zod' && queryParams.length > 0 ? zodResolver.param.query(node, queryParams[0]!) : null,
  ]
  return names.filter((n): n is string => Boolean(n))
}

/**
 * Groups operations into one controller per tag. Operations without a tag fall back to a single
 * `Client`/`ApiClient` controller, matching the resolver's default naming.
 */
function buildControllers(nodes: ReadonlyArray<ast.OperationNode>, ctx: GeneratorContext): Array<Controller> {
  const { driver, resolver, root } = ctx
  const { output, group, validator } = ctx.options

  const pluginTs = driver.getPlugin(pluginTsName)!
  const tsResolver = driver.getResolver(pluginTsName)
  const tsPluginOptions = pluginTs.options
  const pluginZod = isValidatorEnabled(validator) ? driver.getPlugin(pluginZodName) : null
  const zodResolver = pluginZod ? driver.getResolver(pluginZodName) : null
  const document = ctx.adapter.document as SecurityDocument | null | undefined

  function buildOperationData(node: ast.OperationNode): OperationData {
    const typeFile = tsResolver.file({
      ...operationFileEntry(node, node.operationId),
      root,
      output: tsPluginOptions?.output ?? output,
      group: tsPluginOptions?.group,
    })
    const zodFile =
      zodResolver && pluginZod?.options
        ? zodResolver.file({
            ...operationFileEntry(node, node.operationId),
            root,
            output: pluginZod.options?.output ?? output,
            group: pluginZod.options?.group ?? undefined,
          })
        : null

    const security = ast.isHttpOperationNode(node) ? getOperationSecurity({ document, method: node.method, path: node.path }) : undefined

    return { node, name: resolver.name(node.operationId), tsResolver, zodResolver, typeFile, zodFile, security }
  }

  return nodes.reduce((acc, operationNode) => {
    if (!ast.isHttpOperationNode(operationNode)) return acc
    const tag = operationNode.tags[0]
    const name = tag ? (group?.name?.({ group: camelCase(tag) }) ?? resolver.groupName(tag)) : resolver.className('ApiClient')
    const file = resolver.file({ name, extname: '.ts', tag, root, output, group: group ?? undefined })
    const operationData = buildOperationData(operationNode)
    const previous = acc.find((item) => item.file.path === file.path)

    if (previous) {
      previous.operations.push(operationData)
    } else {
      acc.push({ name, tag, file, operations: [operationData] })
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
 * Builds the class-based SDK generator for a client plugin (`@kubb/plugin-fetch`,
 * `@kubb/plugin-axios`). Only registered when `sdk` is set; otherwise the plugin keeps its
 * standalone per-operation functions.
 *
 * Every tag client is an instance class whose constructor takes a client config and builds its own
 * client, so each environment is a separate instance. With `sdk.mode: 'tag'` (the default) it
 * emits one class per tag and, when `sdk.name` is set, a composed root that instantiates every tag
 * client. With `sdk.mode: 'flat'` it emits one class named by `sdk.name`, with every operation as a
 * direct method.
 */
export function createSdkGenerator<TFactory extends ContractClientFactory>(): Generator<TFactory> {
  return defineGenerator<TFactory>({
    name: 'sdk',
    renderer: jsxRenderer,
    operations(nodes, ctx) {
      const { config, resolver, root } = ctx
      const { output, group, validator, sdk } = ctx.options

      const pluginTs = ctx.driver.getPlugin(pluginTsName)
      if (!pluginTs || !sdk) return null

      const controllers = buildControllers(nodes, ctx)
      const clientPath = path.resolve(root, '.kubb/client.ts')

      const banner = (file: ast.FileNode) => resolver.default.banner(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })
      const footer = (file: ast.FileNode) => resolver.default.footer(ctx.meta, { output, config, file: { path: file.path, baseName: file.baseName } })

      const renderClassFile = (className: string, file: ast.FileNode, ops: Array<OperationData>) => {
        const { namesByPath: typeNamesByPath, filesByPath: typeFilesByPath } = collectImportsByFile(ops, (op) => ({
          file: op.typeFile,
          names: resolveTypeImportNames(op.node, op.tsResolver),
        }))
        const { namesByPath: zodNamesByPath, filesByPath: zodFilesByPath } = isValidatorEnabled(validator)
          ? collectImportsByFile(ops, (op) => ({ file: op.zodFile, names: op.zodResolver ? resolveZodImportNames(op.node, op.zodResolver, validator) : [] }))
          : { namesByPath: new Map<string, Set<string>>(), filesByPath: new Map<string, ast.FileNode>() }

        return (
          <File key={file.path} baseName={file.baseName} path={file.path} meta={file.meta} banner={banner(file)} footer={footer(file)}>
            <File.Import name={['createClient']} root={file.path} path={clientPath} />
            <File.Import name={['ClientConfig', 'ClientInstance', 'Options', 'RequestResult']} root={file.path} path={clientPath} isTypeOnly />

            {validator === 'zod' && ops.some((op) => op.node.requestBody?.content?.[0]?.schema != null) && <File.Import name={['z']} path="zod" isTypeOnly />}

            {Array.from(typeNamesByPath.entries()).map(([filePath, set]) => (
              <File.Import key={filePath} name={Array.from(set)} root={file.path} path={typeFilesByPath.get(filePath)!.path} isTypeOnly />
            ))}

            {isValidatorEnabled(validator) &&
              Array.from(zodNamesByPath.entries()).map(([filePath, set]) => (
                <File.Import key={filePath} name={Array.from(set)} root={file.path} path={zodFilesByPath.get(filePath)!.path} />
              ))}

            <SdkClient name={className} operations={ops} validator={validator} />
          </File>
        )
      }

      // `flat` collapses every operation into one class named by `sdk.name`, so callers reach
      // an operation as `new PetStore(config).getPetById(...)` without a per-tag sub-client.
      if (sdk.mode === 'flat') {
        const flatName = resolver.className(sdk.name ?? 'sdk')
        const flatFile = resolver.file({ name: sdk.name ?? 'sdk', extname: '.ts', root, output, group: group ?? undefined })
        const allOps = controllers.flatMap((controller) => controller.operations)

        return renderClassFile(flatName, flatFile, allOps)
      }

      const classFiles = controllers.map(({ name, file, operations: ops }) => renderClassFile(name, file, ops))

      if (!sdk.name) return <>{classFiles}</>

      const sdkFile = resolver.file({ name: sdk.name, extname: '.ts', root, output, group: group ?? undefined })
      const facadeName = resolver.className(sdk.name)
      const members = controllers.map(({ name, tag }) => ({ className: name, propName: resolver.propertyName(tag ?? name) }))

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
