import { ast } from '@kubb/core'
import { functionPrinter } from '@kubb/plugin-ts'

type ParamLeaf = {
  type?: string
  optional?: boolean
  default?: string
  value?: string
  mode?: 'inlineSpread'
}

type ParamGroup = {
  mode: 'object' | 'inlineSpread'
  children: Record<string, ParamLeaf | null | undefined>
  default?: string
}

type ParamSpec = ParamLeaf | ParamGroup

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function isGroup(spec: ParamSpec): spec is ParamGroup {
  return 'children' in spec
}

function groupEntries(group: ParamGroup): Array<[string, ParamLeaf]> {
  return Object.entries(group.children).filter(([, child]) => child != null) as Array<[string, ParamLeaf]>
}

/**
 * Assembles a destructured group parameter from a binding pattern and an optional
 * type literal. Built directly because `createFunctionParameter({ properties })`
 * requires every member to carry a type, while these groups also hold untyped,
 * value-only call entries.
 */
function createGroupParam(
  elements: Array<{ name: string }>,
  members: Array<{ name: string; type: string; optional?: boolean }>,
  default_?: string,
): ast.FunctionParameterNode {
  return {
    kind: 'FunctionParameter',
    name: ast.factory.createObjectBindingPattern({ elements }),
    type: members.length ? ast.factory.createTypeLiteral({ members }) : undefined,
    default: default_,
    optional: false,
  }
}

function createDeclarationLeaf(name: string, spec: ParamLeaf): ast.FunctionParameterNode {
  if (spec.default !== undefined) {
    return ast.factory.createFunctionParameter({ name, type: spec.type, default: spec.default, rest: spec.mode === 'inlineSpread' })
  }

  return ast.factory.createFunctionParameter({ name, type: spec.type, optional: !!spec.optional, rest: spec.mode === 'inlineSpread' })
}

function createDeclarationParam(name: string, spec: ParamSpec): ast.FunctionParameterNode {
  if (isGroup(spec)) {
    const entries = groupEntries(spec)
    const elements = entries.map(([childName]) => ({ name: childName }))
    const members = entries
      .filter(([, child]) => child.type)
      .map(([childName, child]) => ({ name: childName, type: child.type!, optional: !!child.optional || child.default !== undefined }))
    return createGroupParam(elements, members, spec.default)
  }

  return createDeclarationLeaf(name, spec)
}

function createCallParam(name: string, spec: ParamSpec): ast.FunctionParameterNode {
  if (isGroup(spec)) {
    const elements = groupEntries(spec).map(([childName, child]) => ({
      name:
        child.mode === 'inlineSpread'
          ? spec.mode === 'inlineSpread'
            ? (child.value ?? childName)
            : `...${child.value ?? childName}`
          : child.value
            ? `${childName}: ${child.value}`
            : childName,
    }))
    return createGroupParam(elements, [])
  }

  return ast.factory.createFunctionParameter({ name: spec.value ?? name, rest: spec.mode === 'inlineSpread' })
}

/**
 * Creates function parameter builders for generating function signatures and calls.
 * Returns utilities to output constructor signatures (`toConstructor()`) or call expressions (`toCall()`).
 */
export function createFunctionParams(params: Record<string, ParamSpec | null | undefined>) {
  const entries = Object.entries(params).filter(([, spec]) => spec != null) as Array<[string, ParamSpec]>

  return {
    toConstructor() {
      return (
        declarationPrinter.print(
          ast.factory.createFunctionParameters({
            params: entries.map(([name, spec]) => createDeclarationParam(name, spec)),
          }),
        ) ?? ''
      )
    },
    toCall() {
      return (
        callPrinter.print(
          ast.factory.createFunctionParameters({
            params: entries.map(([name, spec]) => createCallParam(name, spec)),
          }),
        ) ?? ''
      )
    },
  }
}
