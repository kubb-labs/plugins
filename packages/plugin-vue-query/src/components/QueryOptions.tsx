import { ast } from '@kubb/core'
import type { ResolverTs } from '@kubb/plugin-ts'
import { functionPrinter } from '@kubb/plugin-ts'
import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import type { PluginVueQuery } from '../types.ts'
import { resolveErrorNames } from '../utils.ts'
import { QueryKey } from './QueryKey.tsx'

type Props = {
  name: string
  clientName: string
  queryKeyName: string
  node: ast.OperationNode
  tsResolver: ResolverTs
  paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
  paramsType: PluginVueQuery['resolvedOptions']['paramsType']
  pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
  dataReturnType: PluginVueQuery['resolvedOptions']['client']['dataReturnType']
}

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

export function getQueryOptionsParams(
  node: ast.OperationNode,
  options: {
    paramsType: PluginVueQuery['resolvedOptions']['paramsType']
    paramsCasing: PluginVueQuery['resolvedOptions']['paramsCasing']
    pathParamsType: PluginVueQuery['resolvedOptions']['pathParamsType']
    resolver: ResolverTs
  },
): ast.FunctionParametersNode {
  const { paramsType, paramsCasing, pathParamsType, resolver } = options
  const requestName = node.requestBody?.schema ? resolver.resolveDataName(node) : undefined

  const baseParams = ast.createOperationParams(node, {
    paramsType,
    pathParamsType: paramsType === 'object' ? 'object' : pathParamsType === 'object' ? 'object' : 'inline',
    paramsCasing,
    resolver,
    extraParams: [
      ast.createFunctionParameter({
        name: 'config',
        type: ast.createParamsType({
          variant: 'reference',
          name: requestName ? `Partial<RequestConfig<${requestName}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }',
        }),
        default: '{}',
      }),
    ],
  })

  return wrapOperationParamsWithMaybeRef(baseParams)
}

function wrapOperationParamsWithMaybeRef(paramsNode: ast.FunctionParametersNode): ast.FunctionParametersNode {
  const wrappedParams = paramsNode.params.map((param) => {
    if ('kind' in param && (param as ast.ParameterGroupNode).kind === 'ParameterGroup') {
      const group = param as ast.ParameterGroupNode
      return {
        ...group,
        properties: group.properties.map((p) => ({
          ...p,
          type: p.type ? ast.createParamsType({ variant: 'reference', name: `MaybeRefOrGetter<${printType(p.type)}>` }) : p.type,
        })),
      }
    }
    const fp = param as ast.FunctionParameterNode
    // Don't wrap 'config' param — it's not reactive
    if (fp.name === 'config') return fp
    return {
      ...fp,
      type: fp.type ? ast.createParamsType({ variant: 'reference', name: `MaybeRefOrGetter<${printType(fp.type)}>` }) : fp.type,
    }
  })
  return ast.createFunctionParameters({ params: wrappedParams })
}

function printType(typeNode: ast.ParamsTypeNode | undefined): string {
  if (!typeNode) return 'unknown'
  if (typeNode.variant === 'reference') return typeNode.name
  if (typeNode.variant === 'member') return `${typeNode.base}['${typeNode.key}']`
  if (typeNode.variant === 'struct') {
    const parts = typeNode.properties.map((p) => {
      const typeStr = printType(p.type)
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p.name) ? p.name : JSON.stringify(p.name)
      return p.optional ? `${key}?: ${typeStr}` : `${key}: ${typeStr}`
    })
    return `{ ${parts.join('; ')} }`
  }
  return 'unknown'
}

export function buildEnabledCheck(paramsNode: ast.FunctionParametersNode): string {
  const required: string[] = []
  for (const param of paramsNode.params) {
    if ('kind' in param && (param as ast.ParameterGroupNode).kind === 'ParameterGroup') {
      const group = param as ast.ParameterGroupNode
      for (const child of group.properties) {
        if (!child.optional && child.default === undefined) {
          required.push(child.name)
        }
      }
    } else {
      const fp = param as ast.FunctionParameterNode
      if (!fp.optional && fp.default === undefined) {
        required.push(fp.name)
      }
    }
  }
  return required.join(' && ')
}

export function QueryOptions({
  name,
  clientName,
  dataReturnType,
  node,
  tsResolver,
  paramsCasing,
  paramsType,
  pathParamsType,
  queryKeyName,
}: Props): KubbReactNode {
  const responseName = tsResolver.resolveResponseName(node)
  const errorNames = resolveErrorNames(node, tsResolver)

  const TData = dataReturnType === 'data' ? responseName : `ResponseConfig<${responseName}>`
  const TError = `ResponseErrorConfig<${errorNames.length > 0 ? errorNames.join(' | ') : 'Error'}>`

  const paramsNode = getQueryOptionsParams(node, { paramsType, paramsCasing, pathParamsType, resolver: tsResolver })
  const paramsSignature = declarationPrinter.print(paramsNode) ?? ''
  const rawParamsCall = callPrinter.print(paramsNode) ?? ''

  // Transform: wrap non-config params with toValue(), add signal to config
  const clientCallStr = rawParamsCall.replace(/\bconfig\b(?=[^,]*$)/, '{ ...config, signal: config.signal ?? signal }')

  const queryKeyParamsNode = QueryKey.getParams(node, { pathParamsType, paramsCasing, resolver: tsResolver })
  const queryKeyParamsCall = callPrinter.print(queryKeyParamsNode) ?? ''

  const enabledSource = buildEnabledCheck(queryKeyParamsNode)
  const enabledText = enabledSource ? `enabled: () => !!(${enabledSource}),` : ''

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export params={paramsSignature}>
        {`
      const queryKey = ${queryKeyName}(${queryKeyParamsCall})
      return queryOptions<${TData}, ${TError}, ${TData}>({
       ${enabledText}
       queryKey,
       queryFn: async ({ signal }) => {
          return ${clientName}(${addToValueCalls(clientCallStr)})
       },
      })
`}
      </Function>
    </File.Source>
  )
}

/**
 * Wraps parameter names with `toValue()` in the client call string,
 * except for 'config'-related params (which are already plain objects).
 *
 * Handles both inline params (`petId, config`) and object shorthand
 * params (`{ petId }, config`) by expanding to `{ petId: toValue(petId) }`.
 */
function addToValueCalls(callStr: string): string {
  // Step 1: Transform shorthand object params like { petId } → { petId: toValue(petId) }
  let result = callStr.replace(/\{\s*([\w,\s]+)\s*\}(?=\s*,)/g, (match, inner: string) => {
    // Only transform simple shorthand (no colons, no spread)
    if (inner.includes(':') || inner.includes('...')) return match
    const keys = inner
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean)
    const wrapped = keys.map((k: string) => `${k}: toValue(${k})`).join(', ')
    return `{ ${wrapped} }`
  })

  // Step 2: Handle standalone identifiers like `data, params`
  result = result.replace(/(?<![{.:?])\b(\w+)\b(?=\s*,)/g, (match, name: string) => {
    if (name === 'config' || name === 'signal' || name === 'undefined') return match
    if (match.includes('toValue(')) return match
    return `toValue(${name})`
  })

  return result
}

QueryOptions.getParams = getQueryOptionsParams
