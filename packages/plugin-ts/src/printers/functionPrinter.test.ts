import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { functionPrinter, renderType } from './functionPrinter.ts'

/**
 * Builds a destructured group parameter with an explicit object-binding name and
 * type, used to cover the cases `createFunctionParameter({ properties })` cannot
 * express (a reference type, or an untyped binding).
 */
function group(elements: Array<{ name: string }>, type?: ast.TypeExpression, default_?: string): ast.FunctionParameterNode {
  return { kind: 'FunctionParameter', name: ast.factory.createObjectBindingPattern({ elements }), type, default: default_, optional: false }
}

describe('renderType', () => {
  it('returns a string reference as-is', () => {
    expect(renderType('QueryParams')).toBe('QueryParams')
  })

  it('renders an indexed access type', () => {
    expect(renderType(ast.factory.createIndexedAccessType({ target: 'GetPetPathParams', key: 'petId' }))).toBe("GetPetPathParams['petId']")
  })

  it('renders a type literal with optional members', () => {
    const type = ast.factory.createTypeLiteral({
      members: [
        { name: 'petId', type: 'string', optional: false },
        { name: 'name', type: 'string', optional: true },
      ],
    })
    expect(renderType(type)).toBe('{ petId: string; name?: string }')
  })

  it('applies transformType to the rendered type', () => {
    expect(renderType('Config', (t) => `Partial<${t}>`)).toBe('Partial<Config>')
  })
})

describe('functionPrinter in declaration mode', () => {
  const printer = functionPrinter({ mode: 'declaration' })

  it('prints required typed parameters as `name: type`', () => {
    const sig = ast.factory.createFunctionParameters({ params: [ast.factory.createFunctionParameter({ name: 'petId', type: 'string', optional: false })] })
    expect(printer.print(sig)).toBe('petId: string')
  })

  it('prints optional typed parameters as `name?: type`', () => {
    const sig = ast.factory.createFunctionParameters({ params: [ast.factory.createFunctionParameter({ name: 'params', type: 'QueryParams', optional: true })] })
    expect(printer.print(sig)).toBe('params?: QueryParams')
  })

  it('prints defaulted typed parameters as `name: type = default`', () => {
    const sig = ast.factory.createFunctionParameters({
      params: [ast.factory.createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' })],
    })
    expect(printer.print(sig)).toBe('config: RequestConfig = {}')
  })

  it('prints rest parameters with spread syntax', () => {
    const sig = ast.factory.createFunctionParameters({ params: [ast.factory.createFunctionParameter({ name: 'args', type: 'string[]', rest: true })] })
    expect(printer.print(sig)).toBe('...args: string[]')
  })

  it('orders parameters as required, optional, then defaulted', () => {
    const sig = ast.factory.createFunctionParameters({
      params: [
        ast.factory.createFunctionParameter({ name: 'config', type: 'Config', default: '{}' }),
        ast.factory.createFunctionParameter({ name: 'params', type: 'Params', optional: true }),
        ast.factory.createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
      ],
    })
    expect(printer.print(sig)).toBe('petId: string, params?: Params, config: Config = {}')
  })

  it('always places rest parameters last', () => {
    const sig = ast.factory.createFunctionParameters({
      params: [
        ast.factory.createFunctionParameter({ name: 'args', type: 'string[]', rest: true }),
        ast.factory.createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
      ],
    })
    expect(printer.print(sig)).toBe('petId: string, ...args: string[]')
  })

  it('prints a destructured group with an inferred inline object type', () => {
    const sig = ast.factory.createFunctionParameters({
      params: [
        ast.factory.createFunctionParameter({
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'name', type: 'string', optional: true },
          ],
          default: '{}',
        }),
      ],
    })
    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string } = {}')
  })

  it('orders required group members before optional ones', () => {
    const sig = ast.factory.createFunctionParameters({
      params: [
        ast.factory.createFunctionParameter({
          properties: [
            { name: 'name', type: 'string', optional: true },
            { name: 'id', type: 'string', optional: false },
          ],
        }),
      ],
    })
    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string }')
  })

  it('appends `= {}` when every group member is optional', () => {
    const sig = ast.factory.createFunctionParameters({
      params: [
        ast.factory.createFunctionParameter({
          properties: [
            { name: 'a', type: 'string', optional: true },
            { name: 'b', type: 'string', optional: true },
          ],
        }),
      ],
    })
    expect(printer.print(sig)).toBe('{ a, b }: { a?: string; b?: string } = {}')
  })

  it('prints a group with an explicit reference type', () => {
    const sig = ast.factory.createFunctionParameters({ params: [group([{ name: 'data' }], 'PetData', '{}')] })
    expect(printer.print(sig)).toBe('{ data }: PetData = {}')
  })

  it('prints mixed group and simple parameters in a stable order', () => {
    const sig = ast.factory.createFunctionParameters({
      params: [
        ast.factory.createFunctionParameter({
          properties: [
            { name: 'id', type: 'string', optional: false },
            { name: 'name', type: 'string', optional: true },
          ],
          default: '{}',
        }),
        ast.factory.createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' }),
      ],
    })
    expect(printer.print(sig)).toBe('{ id, name }: { id: string; name?: string } = {}, config: RequestConfig = {}')
  })

  it('prints default-only parameters without a type annotation', () => {
    const sig = ast.factory.createFunctionParameters({ params: [ast.factory.createFunctionParameter({ name: 'config', default: '{}' })] })
    expect(printer.print(sig)).toBe('config = {}')
  })
})

describe('functionPrinter in call mode', () => {
  const printer = functionPrinter({ mode: 'call' })

  it('prints simple parameter names only', () => {
    const sig = ast.factory.createFunctionParameters({
      params: [
        ast.factory.createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
        ast.factory.createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' }),
      ],
    })
    expect(printer.print(sig)).toBe('petId, config')
  })

  it('prints a destructured group as `{ key1, key2 }`', () => {
    const sig = ast.factory.createFunctionParameters({ params: [group([{ name: 'method' }, { name: 'url' }])] })
    expect(printer.print(sig)).toBe('{ method, url }')
  })

  it('keeps spread syntax for rest parameters', () => {
    const sig = ast.factory.createFunctionParameters({ params: [ast.factory.createFunctionParameter({ name: 'args', rest: true })] })
    expect(printer.print(sig)).toBe('...args')
  })
})

describe('functionPrinter transform options', () => {
  it.each([
    {
      label: 'transformName',
      options: { mode: 'declaration' as const, transformName: (n: string) => n.toUpperCase() },
      param: ast.factory.createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
      expected: 'PETID: string',
    },
    {
      label: 'transformType',
      options: { mode: 'declaration' as const, transformType: (t: string) => `Partial<${t}>` },
      param: ast.factory.createFunctionParameter({ name: 'config', type: 'Config', optional: false }),
      expected: 'config: Partial<Config>',
    },
  ])('applies $label in declaration mode', ({ options, param, expected }) => {
    const printer = functionPrinter(options)
    const sig = ast.factory.createFunctionParameters({ params: [param] })
    expect(printer.print(sig)).toBe(expected)
  })
})
