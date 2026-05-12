import { transformParamTypes } from '@internals/tanstack-query'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginReactQuery } from '../types.ts'
import { getComments, resolveErrorNames } from '../utils.ts'
import { QueryKey } from './QueryKey.tsx'
import { getQueryOptionsParams } from './QueryOptions.tsx'

type Props = {
  name: string
  queryOptionsName: string
  queryKeyName: string
  queryKeyTypeName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginReactQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
  pathParamsAsGetters: PluginReactQuery['resolvedOptions']['pathParamsAsGetters']
  dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
  customOptions: PluginReactQuery['resolvedOptions']['customOptions']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

/**
 * Path-parameter names for an operation, with `paramsCasing` applied so they
 * match the names emitted by {@link ast.createOperationParams}.
 */
function collectPathParamNames(node: ast.OperationNode, paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']): Set<string> {
  const pathParams = (node.parameters ?? []).filter((p) => p.in === 'path')
  return new Set(ast.caseParams(pathParams, paramsCasing).map((p) => p.name))
}

/**
 * Widen path-parameter types to `T | (() => T) | undefined`.
 */
function wrapPathParamsAsGetters(paramsNode: ast.FunctionParametersNode, pathParamNames: ReadonlySet<string>): ast.FunctionParametersNode {
  return transformParamTypes(paramsNode, {
    wrapType: (inner) => `${inner} | (() => ${inner}) | undefined`,
    shouldWrap: (p) => pathParamNames.has(p.name),
  })
}

/**
 * Body prelude that unwraps each path-param getter into a `${name}_` shadow.
 */
function buildUnwrapPrelude(pathParamNames: ReadonlySet<string>): string {
  if (pathParamNames.size === 0) return ''
  return [...pathParamNames].map((n) => `const ${n}_ = typeof ${n} === 'function' ? ${n}() : ${n}`).join('\n')
}

/**
 * Rewrite a printed call expression so each path-param identifier is
 * replaced by its shadow variable. Two passes: expand object-literal
 * shorthand (`{ id }` -> `{ id: id }`), then swap bare references for
 * `id_` while leaving keys and member accesses untouched.
 *
 * @note Relies on `callPrinter` only emitting path-param names as bare
 * identifiers or as object-literal shorthand; the snapshot tests pin this
 * contract.
 */
function buildArgRewriter(pathParamNames: ReadonlySet<string>): (expr: string) => string {
  if (pathParamNames.size === 0) return (expr) => expr
  const names = [...pathParamNames]
  return (expr) => {
    let out = expr
    for (const n of names) {
      // Step 1: expand object-literal shorthand `{ id }` -> `{ id: id }`
      out = out.replace(new RegExp(`([{,]\\s*)\\b${n}\\b(\\s*[,}])`, 'g'), `$1${n}: ${n}$2`)
    }
    for (const n of names) {
      // Step 2: rename bare references to the shadow var, skipping object keys and member-access
      out = out.replace(new RegExp(`(?<![.])\\b${n}\\b(?!\\s*:)`, 'g'), `${n}_`)
    }
    return out
  }
}

function getParams(
  node: ast.OperationNode,
  options: {
    paramsType: PluginReactQuery['resolvedOptions']['paramsType']
    paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
    pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
    pathParamNames: ReadonlySet<string>
    dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, pathParamNames, dataReturnType, resolver } = options
  const responseName = resolver.resolveResponseName(node)
  const requestName = node.requestBody?.content?.[0]?.schema ? resolver.resolveDataName(node) : undefined
  const errorNames = resolveErrorNames(node, resolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const optionsParam = ast.createFunctionParameter({
    name: 'options',
    type: ast.createParamsType({
      variant: 'reference',
      name: `{
  query?: Partial<QueryObserverOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'}
}`,
    }),
    default: '{}',
  })

  const baseParams = ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver,
    extraParams: [optionsParam],
  })

  if (pathParamNames.size === 0) return baseParams
  return wrapPathParamsAsGetters(baseParams, pathParamNames)
}

export function Query({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  paramsType,
  paramsCasing,
  pathParamsType,
  pathParamsAsGetters,
  dataReturnType,
  node,
  tsResolver,
  customOptions,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`
  const returnType = `UseQueryResult<${'TData'}, ${TError}> & { queryKey: TQueryKey }`
  const generics = [`TData = ${TData}`, `TQueryData = ${TData}`, `TQueryKey extends QueryKey = ${queryKeyTypeName}`]

  const pathParamNames = pathParamsAsGetters ? collectPathParamNames(node, paramsCasing) : new Set<string>()

  const queryKeyParamsNode = QueryKey.getParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = getParams(node, { paramsType, paramsCasing, pathParamsType, pathParamNames, dataReturnType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''

  const prelude = buildUnwrapPrelude(pathParamNames)
  const rewriteArgs = buildArgRewriter(pathParamNames)

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export generics={generics.join(', ')} params={paramsSignature} returnType={undefined} JSDoc={{ comments: getComments(node) }}>
        {`
       ${prelude ? `${prelude}\n       ` : ''}const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyName}(${rewriteArgs(queryKeyParamsCall)})
       ${customOptions ? `const customOptions = ${customOptions.name}({ hookName: '${name}', operationId: '${node.operationId}' })` : ''}

       const query = useQuery({
        ...${queryOptionsName}(${rewriteArgs(queryOptionsParamsCall)}),${customOptions ? '\n...customOptions,' : ''}
        ...resolvedOptions,
        queryKey,
       } as unknown as QueryObserverOptions, queryClient) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  )
}

Query.getParams = getParams
