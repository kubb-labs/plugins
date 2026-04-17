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
  children: Record<string, ParamLeaf | undefined>
  default?: string
}

type ParamSpec = ParamLeaf | ParamGroup

const declarationPrinter = functionPrinter({ mode: 'declaration' })
const callPrinter = functionPrinter({ mode: 'call' })

function isGroup(spec: ParamSpec): spec is ParamGroup {
  return 'children' in spec
}

function createType(type?: string) {
  return type ? ast.createParamsType({ variant: 'reference', name: type }) : undefined
}

function createDeclarationLeaf(name: string, spec: ParamLeaf): ast.FunctionParameterNode {
  if (spec.default !== undefined) {
    return ast.createFunctionParameter({
      name,
      type: createType(spec.type),
      default: spec.default,
      rest: spec.mode === 'inlineSpread',
    })
  }

  return ast.createFunctionParameter({
    name,
    type: createType(spec.type),
    optional: !!spec.optional,
    rest: spec.mode === 'inlineSpread',
  })
}

function createDeclarationParam(name: string, spec: ParamSpec): ast.FunctionParameterNode | ast.ParameterGroupNode {
  if (isGroup(spec)) {
    return ast.createParameterGroup({
      inline: spec.mode === 'inlineSpread',
      default: spec.default,
      properties: Object.entries(spec.children)
        .filter(([, child]) => child !== undefined)
        .map(([childName, child]) => createDeclarationLeaf(childName, child!)),
    })
  }

  return createDeclarationLeaf(name, spec)
}

function createCallParam(name: string, spec: ParamSpec): ast.FunctionParameterNode | ast.ParameterGroupNode {
  if (isGroup(spec)) {
    return ast.createParameterGroup({
      inline: spec.mode === 'inlineSpread',
      properties: Object.entries(spec.children)
        .filter(([, child]) => child !== undefined)
        .map(([childName, child]) =>
          ast.createFunctionParameter({
            name:
              child?.mode === 'inlineSpread'
                ? spec.mode === 'inlineSpread'
                  ? (child.value ?? childName)
                  : `...${child.value ?? childName}`
                : child?.value
                  ? `${childName}: ${child.value}`
                  : childName,
            rest: spec.mode === 'inlineSpread' && child?.mode === 'inlineSpread',
          }),
        ),
    })
  }

  return ast.createFunctionParameter({
    name: spec.value ?? name,
    rest: spec.mode === 'inlineSpread',
  })
}

export function createFunctionParams(params: Record<string, ParamSpec | undefined>) {
  const entries = Object.entries(params).filter(([, spec]) => spec !== undefined) as Array<[string, ParamSpec]>

  return {
    toConstructor() {
      return (
        declarationPrinter.print(
          ast.createFunctionParameters({
            params: entries.map(([name, spec]) => createDeclarationParam(name, spec)),
          }),
        ) ?? ''
      )
    },
    toCall() {
      return (
        callPrinter.print(
          ast.createFunctionParameters({
            params: entries.map(([name, spec]) => createCallParam(name, spec)),
          }),
        ) ?? ''
      )
    },
  }
}
