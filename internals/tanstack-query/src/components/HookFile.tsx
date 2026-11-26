import { ast } from '@internals/ast'
import { getResponseHeadersTypeNames, resolveOperationTypes } from '@internals/client'
import { resolveOperationTypeNames } from '@internals/shared'
import { code, Diagnostics, type FileTarget, type TemplateContext, useKubb } from '@kubb/kit'
import type { ResolverTs } from '@kubb/plugin-ts'
import { File } from '@kubb/renderer-jsx'
import { type HookFileVariant, hookFileName } from '../resolver.ts'
import type { KubbReactNode } from '@kubb/renderer-jsx'
import type { ClientOperation, ReturnTypeOption } from '@internals/client'

export type ResolveHookFileOptions = {
  /** The hook's variant, which names its file through `hookFileName`. */
  variant?: HookFileVariant
  contractOp: ClientOperation
  /**
   * The `<Key>` type alias declared in this file, left out of the imported type names.
   */
  keyTypeName?: string
  /**
   * Type names imported right after the response options type.
   */
  extraTypeNames?: Array<string | null | undefined>
  returnType?: ReturnTypeOption
}

export type ResolvedHookFile = {
  file: FileTarget
  tsResolver: ResolverTs
  contractOp: ClientOperation
  /** The imports of the operation type names, from the `types` provider. */
  typeImports: ReadonlyArray<ast.ImportNode>
  /**
   * The client's result type the hook names with `returnType: 'full'`.
   */
  resultTypeName: 'RequestResult' | 'RequestResultWithHeaders'
  returnType: ReturnTypeOption
}

/**
 * Resolves what every TanStack hook file shares: its file with banner and footer, and the type imports from the `types` provider.
 */
export function resolveHookFile(node: ast.OperationNode, options: ResolveHookFileOptions): ResolvedHookFile {
  const ctx = useKubb<TemplateContext>()
  const { variant = '', contractOp, keyTypeName, extraTypeNames = [], returnType = 'data' } = options
  if (returnType !== 'data' && contractOp.returnType === 'data') {
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidPluginOptions,
      severity: 'error',
      message: `Option \`returnType\` is '${returnType}' for ${node.operationId}, but the client plugin has \`returnType: 'data'\` and only returns the response body.`,
      help: "Set the client plugin's `returnType` to 'full', or set the hook plugin's `returnType` to 'data'.",
      location: { kind: 'config' },
      plugin: ctx.resolver.pluginName,
    })
  }
  const types = resolveOperationTypes()
  const tsResolver = types.resolver
  const headerTypeNames = returnType === 'data' || !contractOp.typedHeaders ? [] : getResponseHeadersTypeNames({ node, types: tsResolver })

  const file = ctx.file(node, { name: hookFileName({ resolver: ctx.resolver, node, variant }) })
  const typeSource = ctx.from('types')
  const typeRefs = [
    typeSource.resolver.response.options(node),
    typeSource.resolver.response.responses(node),
    ...[
      ...headerTypeNames,
      ...extraTypeNames,
      ...resolveOperationTypeNames(node, tsResolver, {
        // The full result only names error statuses (in ResponseErrorConfig); success statuses are unused.
        responseStatusNames: returnType === 'data' ? undefined : 'error',
        // The joined response alias is unused with the full result, and the printer keeps it as a substring of the responses record name.
        exclude: [keyTypeName, returnType !== 'data' ? tsResolver.response.response(node) : null].filter((name): name is string => Boolean(name)),
        order: 'body-response-first',
        includeParams: false,
      }),
    ].flatMap((typeName) => (typeName ? [typeSource.ref(node, typeName)] : [])),
  ]

  return {
    file,
    tsResolver,
    contractOp,
    typeImports: code.join(typeRefs).imports,
    resultTypeName: headerTypeNames.length ? 'RequestResultWithHeaders' : 'RequestResult',
    returnType,
  }
}

export type HookFileProps = {
  hook: ResolvedHookFile
  /**
   * Framework imports rendered between the client imports and the type import.
   */
  imports?: KubbReactNode
  children?: KubbReactNode
}

/**
 * The `<File>` shell shared by the TanStack hook generators; renders `children` after the imports.
 */
export function HookFile({ hook, imports, children }: HookFileProps): KubbReactNode {
  const { file, contractOp, typeImports, resultTypeName } = hook

  return (
    <File {...file}>
      <File.Import names={[contractOp.moduleName]} root={file.path} path={contractOp.path} />
      <File.Import
        names={['RequestConfig', 'ResponseErrorConfig', resultTypeName].map((name) => ({ name, space: 'type' as const }))}
        root={contractOp.clientPathIsFile ? file.path : undefined}
        path={contractOp.clientPath}
      />

      {imports}
      {typeImports.map((imp) => (
        <File.Import key={imp.path} names={ast.imports.asType(imp)} root={file.path} path={imp.path} />
      ))}

      {children}
    </File>
  )
}
