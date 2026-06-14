import { ast } from '@kubb/core'
import { PARAM_RANK } from '../constants.ts'

/**
 * Maps each function-printer handler key to its concrete node type.
 */
export type FunctionNodeByType = {
  functionParameter: ast.FunctionParameterNode
  functionParameters: ast.FunctionParametersNode
}

const kindToHandlerKey = {
  FunctionParameter: 'functionParameter',
  FunctionParameters: 'functionParameters',
} satisfies Partial<Record<string, ast.FunctionNodeType>>

/**
 * Renders a {@link ast.TypeExpression} to its TypeScript source.
 *
 * - a `string` is a type reference, returned as-is
 * - an `IndexedAccessType` becomes `objectType['indexType']`
 * - a `TypeLiteral` becomes `{ key: Type; key?: Type }`
 *
 * `transformType` is applied once to the fully rendered type, matching how the
 * printer wrapped reference types before the `ts.factory` model.
 */
export function renderType(type: ast.TypeExpression, transformType?: (type: string) => string): string {
  const rendered = renderTypeExpression(type)
  return transformType ? transformType(rendered) : rendered
}

function renderTypeExpression(type: ast.TypeExpression): string {
  if (typeof type === 'string') return type
  if (type.kind === 'IndexedAccessType') return `${type.objectType}['${type.indexType}']`

  const parts = type.members.map((member) => {
    const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(member.name) ? member.name : JSON.stringify(member.name)
    const value = renderTypeExpression(member.type)
    return member.optional ? `${key}?: ${value}` : `${key}: ${value}`
  })
  return `{ ${parts.join('; ')} }`
}

export type FunctionPrinterOptions = {
  /**
   * Rendering modes supported by `functionPrinter`.
   *
   * | Mode          | Output example                    | Use case                       |
   * |---------------|-----------------------------------|--------------------------------|
   * | `declaration` | `id: string, config: Config = {}` | Function parameter declaration |
   * | `call`        | `id, { method, url }`             | Function call arguments        |
   */
  mode: 'declaration' | 'call'
  /**
   * Optional transformation applied to every parameter name before printing.
   */
  transformName?: (name: string) => string
  /**
   * Optional transformation applied to every type string before printing.
   */
  transformType?: (type: string) => string
}

type DefaultPrinter = ast.PrinterFactoryOptions<'functionParameters', FunctionPrinterOptions, string>

function groupMembers(param: ast.FunctionParameterNode): ReadonlyArray<{ name: string; optional?: boolean }> | null {
  if (typeof param.name === 'string') return null
  return param.type && typeof param.type !== 'string' && param.type.kind === 'TypeLiteral' ? param.type.members : []
}

function rank(param: ast.FunctionParameterNode): number {
  if (param.rest) return PARAM_RANK.rest
  if (param.default) return PARAM_RANK.withDefault
  const members = groupMembers(param)
  if (members) return members.every((m) => m.optional) ? PARAM_RANK.optional : PARAM_RANK.required
  return param.optional ? PARAM_RANK.optional : PARAM_RANK.required
}

function sortParams(params: ReadonlyArray<ast.FunctionParameterNode>): Array<ast.FunctionParameterNode> {
  return params.toSorted((a, b) => rank(a) - rank(b))
}

/**
 * Orders a destructured group's binding elements and type members together,
 * required fields first, matching how grouped children were sorted before.
 */
function sortedGroupMembers(
  name: ast.ObjectBindingPatternNode,
  type: ast.TypeExpression | undefined,
): Array<{ name: string; type?: ast.TypeExpression; optional?: boolean }> {
  const members = type && typeof type !== 'string' && type.kind === 'TypeLiteral' ? type.members : []
  const memberRank = (optional?: boolean) => (optional ? PARAM_RANK.optional : PARAM_RANK.required)
  return name.elements
    .map((element, index) => ({ name: element.name, type: members[index]?.type, optional: members[index]?.optional }))
    .toSorted((a, b) => memberRank(a.optional) - memberRank(b.optional))
}

/**
 * Renders the type annotation of a destructured group. An inline object type is
 * rendered from the already-sorted members so its key order matches the binding;
 * a reference type is rendered as-is.
 */
function renderGroupType(
  type: ast.TypeExpression | undefined,
  sorted: Array<{ name: string; type?: ast.TypeExpression; optional?: boolean }>,
  transformType?: (type: string) => string,
): string | undefined {
  if (!type) return undefined
  if (typeof type === 'string' || type.kind !== 'TypeLiteral') return renderType(type)

  const typed = sorted.filter((member) => member.type !== undefined)
  if (!typed.length) return undefined
  const parts = typed.map((member) => {
    const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(member.name) ? member.name : JSON.stringify(member.name)
    const value = renderType(member.type!, transformType)
    return member.optional ? `${key}?: ${value}` : `${key}: ${value}`
  })
  return `{ ${parts.join('; ')} }`
}

/**
 * Creates a function-parameter printer factory.
 *
 * Uses `createPrinterFactory` and dispatches handlers by `node.kind`
 * (for function nodes) rather than by `node.type` (for schema nodes).
 */
export const defineFunctionPrinter = ast.createPrinterFactory<ast.FunctionParamNode, ast.FunctionNodeType, FunctionNodeByType>(
  (node) => kindToHandlerKey[node.kind as keyof typeof kindToHandlerKey],
)

/**
 * Default function-signature printer. Renders a parameter list in one of two modes:
 * `declaration` for the function signature and `call` for the call arguments.
 *
 * @example
 * ```ts
 * const printer = functionPrinter({ mode: 'declaration' })
 *
 * const sig = createFunctionParameters({
 *   params: [
 *     createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
 *     createFunctionParameter({ name: 'config', type: 'Config', optional: false, default: '{}' }),
 *   ],
 * })
 *
 * printer.print(sig)  // → "petId: string, config: Config = {}"
 * ```
 */
export const functionPrinter = defineFunctionPrinter<DefaultPrinter>((options) => ({
  name: 'functionParameters',
  options,
  nodes: {
    functionParameter(node) {
      const { mode, transformName, transformType } = this.options
      const isGroup = typeof node.name !== 'string'

      if (mode === 'call') {
        if (isGroup) {
          const keys = sortedGroupMembers(node.name as ast.ObjectBindingPatternNode, node.type)
            .map((member) => member.name)
            .join(', ')
          return `{ ${keys} }`
        }
        const name = transformName ? transformName(node.name as string) : (node.name as string)
        return node.rest ? `...${name}` : name
      }

      if (isGroup) {
        const sorted = sortedGroupMembers(node.name as ast.ObjectBindingPatternNode, node.type)
        const binding = `{ ${sorted.map((member) => (transformName ? transformName(member.name) : member.name)).join(', ')} }`
        const allOptional = sorted.every((member) => member.optional)
        const type = renderGroupType(node.type, sorted, transformType)
        if (type) {
          if (allOptional) return `${binding}: ${type} = ${node.default ?? '{}'}`
          return node.default ? `${binding}: ${type} = ${node.default}` : `${binding}: ${type}`
        }
        return node.default ? `${binding} = ${node.default}` : binding
      }

      const name = transformName ? transformName(node.name as string) : (node.name as string)
      const type = node.type ? renderType(node.type, transformType) : undefined

      if (node.rest) {
        return type ? `...${name}: ${type}` : `...${name}`
      }
      if (type) {
        if (node.optional) return `${name}?: ${type}`
        return node.default ? `${name}: ${type} = ${node.default}` : `${name}: ${type}`
      }
      return node.default ? `${name} = ${node.default}` : name
    },
    functionParameters(node) {
      return sortParams(node.params)
        .map((p) => this.transform(p))
        .filter(Boolean)
        .join(', ')
    },
  },
}))
