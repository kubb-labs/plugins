import { transformParamTypes } from '@internals/tanstack-query'
import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginReactQuery } from '../types.ts'
import { buildQueryKeyParams, getComments, resolveErrorNames } from '../utils.ts'
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

function collectPathParamNames(node: ast.OperationNode, paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']): Set<string> {
  const pathParams = (node.parameters ?? []).filter((p) => p.in === 'path')
  return new Set(ast.caseParams(pathParams, paramsCasing).map((p) => p.name))
}

function wrapPathParamsAsGetters(paramsNode: ast.FunctionParametersNode, pathParamNames: ReadonlySet<string>): ast.FunctionParametersNode {
  return transformParamTypes(paramsNode, {
    wrapType: (inner) => `${inner} | (() => ${inner}) | undefined`,
    shouldWrap: (p) => pathParamNames.has(p.name),
  })
}

function buildUnwrapPrelude(pathParamNames: ReadonlySet<string>): string {
  if (pathParamNames.size === 0) return ''
  return [...pathParamNames].map((n) => `const ${n}_ = typeof ${n} === 'function' ? ${n}() : ${n}`).join('\n')
}

function buildArgRewriter(pathParamNames: ReadonlySet<string>): (expr: string) => string {
  if (pathParamNames.size === 0) return (expr) => expr
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const names = [...pathParamNames]
  return (expr) => {
    let out = expr.replace(/\{[^{}]*\}/g, (block) => {
      let inner = block
      for (const n of names) {
        const e = escape(n)
        inner = inner.replace(new RegExp(`([{,]\\s*)\\b${e}\\b(\\s*[,}])`, 'g'), `$1${n}: ${n}$2`)
      }
      return inner
    })
    for (const n of names) {
      const e = escape(n)
      out = out.replace(new RegExp(`(?<![.])\\b${e}\\b(?!\\s*:)`, 'g'), `${n}_`)
    }
    return out
  }
}

function buildQueryParamsNode(
  node: ast.OperationNode,
  options: {
    paramsType: PluginReactQuery['resolvedOptions']['paramsType']
    paramsCasing: PluginReactQuery['resolvedOptions']['paramsCasing']
    pathParamsType: PluginReactQuery['resolvedOptions']['pathParamsType']
    pathParamNames?: ReadonlySet<string>
    dataReturnType: PluginReactQuery['resolvedOptions']['client']['dataReturnType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, pathParamNames = new Set<string>(), dataReturnType, resolver } = options
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

  const queryKeyParamsNode = buildQueryKeyParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const queryOptionsParamsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver })
  const queryOptionsParamsCall = callPrinter.print(queryOptionsParamsNode) ?? ''

  const paramsNode = buildQueryParamsNode(node, { paramsType, paramsCasing, pathParamsType, pathParamNames, dataReturnType, resolver: tsResolver })
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
