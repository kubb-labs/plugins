import { ast, pascalCase, Resolver } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { createCasedFile, createOperationParamResolver, createOperationResponseResolver, resolveOperationName } from './resolver.ts'

const resolver = new Resolver({ pluginName: 'test', name: pascalCase })

describe('resolveOperationName', () => {
  test.each([
    'export',
    'import',
    'delete',
    'default',
    'new',
    'class',
    'await',
    'yield',
    'enum',
    'arguments',
    'eval',
    'implements',
    'interface',
    'let',
    'package',
    'private',
    'protected',
    'public',
    'static',
  ])('escapes %s', (name) => {
    expect(resolveOperationName.call(resolver, name)).toBe(`_${name}`)
  })

  test.each([
    ['Export', '_export'],
    ['delete pet', 'deletePet'],
    ['get-pet-by-id', 'getPetById'],
    ['123pets', '_123Pets'],
  ])('resolves %s as %s', (name, expected) => {
    expect(resolveOperationName.call(resolver, name)).toBe(expected)
  })
})

const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

describe('createOperationParamResolver', () => {
  const param = createOperationParamResolver()

  test('name uses the <operationId> <in> <name> template', () => {
    const parameter = ast.factory.createParameter({ name: 'pet-id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }) })
    expect(param.name.call(resolver, node, parameter)).toBe('ListPetsPathPetId')
  })

  test('path/query/headers use the grouped templates', () => {
    expect(param.path.call(resolver, node)).toBe('ListPetsPath')
    expect(param.query.call(resolver, node)).toBe('ListPetsQuery')
    expect(param.headers.call(resolver, node)).toBe('ListPetsHeaders')
  })
})

describe('createOperationResponseResolver', () => {
  const response = createOperationResponseResolver()

  test('keeps declaration keys distinct when custom naming collapses their names', () => {
    const resolver = new Resolver({ pluginName: 'test', name: () => 'Same' })
    const param = createOperationParamResolver()
    expect(response.body.call(resolver, node)).toBe('Same')
    expect(response.status.call(resolver, node, '200')).toBe('Same2')
    expect(response.status.call(resolver, node, '400')).toBe('Same3')
    expect(response.responses.call(resolver, node)).toBe('Same4')
    expect(response.response.call(resolver, node)).toBe('Same5')
    expect(param.path.call(resolver, node)).toBe('Same6')
    expect(param.query.call(resolver, node)).toBe('Same7')
    expect(param.headers.call(resolver, node)).toBe('Same8')
    expect(response.body.call(resolver, node)).toBe('Same')
    expect(response.status.call(resolver, node, '200')).toBe('Same2')
  })

  test('status/body/responses/response use the grouped templates', () => {
    expect(response.status.call(resolver, node, '200')).toBe('ListPetsStatus200')
    expect(response.body.call(resolver, node)).toBe('ListPetsBody')
    expect(response.responses.call(resolver, node)).toBe('ListPetsResponses')
    expect(response.response.call(resolver, node)).toBe('ListPetsResponse')
  })
})

describe('createCasedFile', () => {
  test('baseName cases the final segment and appends the extension', () => {
    const file = createCasedFile(pascalCase)
    expect(file.baseName?.call(resolver, { name: 'pet.petId', extname: '.ts' })).toBe('pet/PetId.ts')
  })
})
