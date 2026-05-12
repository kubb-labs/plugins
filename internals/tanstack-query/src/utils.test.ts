import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { printType, transformParamTypes } from './utils.ts'

const ref = (name: string) => ast.createParamsType({ variant: 'reference', name })
const member = (base: string, key: string) => ast.createParamsType({ variant: 'member', base, key })

describe('printType', () => {
  test('reference variant returns the raw name', () => {
    expect(printType(ref('string'))).toBe('string')
    expect(printType(ref('Pet'))).toBe('Pet')
  })

  test('member variant renders bracket access', () => {
    expect(printType(member('PathParams', 'petId'))).toBe("PathParams['petId']")
  })

  test('struct variant renders inline object type', () => {
    const struct = ast.createParamsType({
      variant: 'struct',
      properties: [
        { name: 'petId', type: ref('string'), optional: false },
        { name: 'status', type: ref('Status'), optional: true },
      ],
    })
    expect(printType(struct)).toBe('{ petId: string; status?: Status }')
  })

  test('undefined input falls back to unknown', () => {
    expect(printType(undefined)).toBe('unknown')
  })

  test('struct keys with non-identifier characters are quoted', () => {
    const struct = ast.createParamsType({
      variant: 'struct',
      properties: [{ name: 'X-Header', type: ref('string'), optional: false }],
    })
    expect(printType(struct)).toBe('{ "X-Header": string }')
  })
})

describe('transformParamTypes', () => {
  test('wraps the types of inline params accepted by shouldWrap', () => {
    const node = ast.createFunctionParameters({
      params: [ast.createFunctionParameter({ name: 'petId', type: ref('string') }), ast.createFunctionParameter({ name: 'data', type: ref('Body') })],
    })

    const result = transformParamTypes(node, {
      wrapType: (inner) => `Wrapped<${inner}>`,
      shouldWrap: (p) => p.name === 'petId',
    })

    const first = result.params[0] as ast.FunctionParameterNode
    const second = result.params[1] as ast.FunctionParameterNode
    expect((first.type as { name: string }).name).toBe('Wrapped<string>')
    expect((second.type as { name: string }).name).toBe('Body')
  })

  test('walks into ParameterGroup properties and skips those rejected by shouldWrap', () => {
    const node = ast.createFunctionParameters({
      params: [
        {
          kind: 'ParameterGroup',
          properties: [ast.createFunctionParameter({ name: 'petId', type: ref('string') }), ast.createFunctionParameter({ name: 'kind', type: ref('Kind') })],
          inline: false,
        } as ast.ParameterGroupNode,
      ],
    })

    const result = transformParamTypes(node, {
      wrapType: (inner) => `Wrapped<${inner}>`,
      shouldWrap: (p) => p.name === 'petId',
    })

    const group = result.params[0] as ast.ParameterGroupNode
    expect((group.properties[0]!.type as { name: string }).name).toBe('Wrapped<string>')
    expect((group.properties[1]!.type as { name: string }).name).toBe('Kind')
  })

  test('passes params without a type annotation through unchanged', () => {
    const node = ast.createFunctionParameters({
      params: [ast.createFunctionParameter({ name: 'petId' })],
    })

    const result = transformParamTypes(node, {
      wrapType: (inner) => `Wrapped<${inner}>`,
      shouldWrap: () => true,
    })

    expect((result.params[0] as ast.FunctionParameterNode).type).toBeUndefined()
  })
})
