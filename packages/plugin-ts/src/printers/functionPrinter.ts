import { ast } from '@kubb/core'
import { PARAM_RANK } from '../constants.ts'

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

/**
 * Renders an object-type key, quoting it as a string literal when it is not a valid
 * identifier so `{ 'content-type': string }` stays valid TypeScript.
 */
function renderKey(name: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : JSON.stringify(name)
}

function renderTypeExpression(type: ast.TypeExpression): string {
  if (typeof type === 'string') return type
  if (ast.indexedAccessTypeDef.is(type)) return `${type.target}['${type.key}']`

  const parts = type.members.map((member) => {
    const value = renderTypeExpression(member.type)
    return member.optional ? `${renderKey(member.name)}?: ${value}` : `${renderKey(member.name)}: ${value}`
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

function groupMembers(param: ast.FunctionParameterNode): ReadonlyArray<{ name: string; optional?: boolean }> | null {
  if (typeof param.name === 'string') return null
  return param.type && ast.typeLiteralDef.is(param.type) ? param.type.members : []
}

function rank(param: ast.FunctionParameterNode): number {
  if (param.rest) return PARAM_RANK.rest
  if (param.default) return PARAM_RANK.withDefault
  const members = groupMembers(param)
  if (members) return members.every((m) => m.optional) ? PARAM_RANK.optional : PARAM_RANK.required
  return param.optional ? PARAM_RANK.optional : PARAM_RANK.required
}

function sortParams(params: ReadonlyArray<ast.FunctionParameterNode>): Array<ast.FunctionParameterNode> {
  // `toSorted` is a stable sort, so equal-rank params keep their declared order.
  return params.toSorted((a, b) => rank(a) - rank(b))
}

/**
 * Orders a destructured group's binding elements and type members together,
 * required fields first, matching how grouped children were sorted before.
 */
type GroupMember = { name: string; propertyName?: string; type?: ast.TypeExpression; optional?: boolean }

function sortedGroupMembers(name: ast.ObjectBindingPatternNode, type: ast.TypeExpression | undefined): Array<GroupMember> {
  const members = type && ast.typeLiteralDef.is(type) ? type.members : []
  const memberRank = (optional?: boolean) => (optional ? PARAM_RANK.optional : PARAM_RANK.required)
  return name.elements
    .map((element, index) => ({
      name: element.name,
      propertyName: element.propertyName,
      type: members[index]?.type,
      optional: members[index]?.optional,
    }))
    .toSorted((a, b) => memberRank(a.optional) - memberRank(b.optional))
}

/**
 * Renders one binding element: the local name, prefixed with its source key when the
 * binding renames the property, as in `{ petId: id }`.
 */
function renderBindingMember(member: GroupMember, transformName?: (name: string) => string): string {
  const local = transformName ? transformName(member.name) : member.name
  return member.propertyName ? `${member.propertyName}: ${local}` : local
}

/**
 * Renders the type annotation of a destructured group. An inline object type is
 * rendered from the already-sorted members so its key order matches the binding;
 * a reference type is rendered as-is.
 */
function renderGroupType(type: ast.TypeExpression | undefined, sorted: Array<GroupMember>, transformType?: (type: string) => string): string | undefined {
  if (!type) return undefined
  if (!ast.typeLiteralDef.is(type)) return renderType(type)

  const typed = sorted.filter((member) => member.type !== undefined)
  if (!typed.length) return undefined
  const parts = typed.map((member) => {
    const key = renderKey(member.propertyName ?? member.name)
    const value = renderType(member.type!, transformType)
    return member.optional ? `${key}?: ${value}` : `${key}: ${value}`
  })
  return `{ ${parts.join('; ')} }`
}

function printParameter(node: ast.FunctionParameterNode, options: FunctionPrinterOptions): string {
  const { mode, transformName, transformType } = options
  const isGroup = typeof node.name !== 'string'

  if (mode === 'call') {
    if (isGroup) {
      const keys = sortedGroupMembers(node.name as ast.ObjectBindingPatternNode, node.type)
        .map((member) => renderBindingMember(member))
        .join(', ')
      return `{ ${keys} }`
    }
    const name = transformName ? transformName(node.name as string) : (node.name as string)
    return node.rest ? `...${name}` : name
  }

  if (isGroup) {
    const sorted = sortedGroupMembers(node.name as ast.ObjectBindingPatternNode, node.type)
    const binding = `{ ${sorted.map((member) => renderBindingMember(member, transformName)).join(', ')} }`
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
}

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
export function functionPrinter(options: FunctionPrinterOptions) {
  return {
    name: 'functionParameters' as const,
    options,
    print(node: ast.FunctionParametersNode): string {
      return sortParams(node.params)
        .map((p) => printParameter(p, options))
        .filter(Boolean)
        .join(', ')
    },
  }
}
