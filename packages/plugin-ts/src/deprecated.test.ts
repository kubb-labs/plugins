import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { functionPrinter } from './deprecated.ts'

describe('functionPrinter', () => {
  const params = ast.factory.createFunctionParameters({ params: [ast.factory.createFunctionParameter({ name: 'petId', type: 'string' })] })

  it('prints through ast.params without transforms', () => {
    expect(functionPrinter({ mode: 'declaration' }).print(params)).toBe('petId: string')
  })

  it('keeps transformName and transformType', () => {
    const printer = functionPrinter({ mode: 'declaration', transformName: (name) => name.toUpperCase(), transformType: (type) => `Partial<${type}>` })
    expect(printer.print(params)).toBe('PETID: Partial<string>')
  })
})
