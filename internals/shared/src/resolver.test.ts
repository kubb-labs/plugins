import { camelCase, pascalCase } from '@internals/utils'
import type { Resolver } from 'kubb/kit'
import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { createCasedFile, createOperationParamResolver, createOperationResponseResolver, operationParamName } from './resolver.ts'

const resolver = { name: (name: string) => pascalCase(name) } as unknown as Resolver
const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

describe('createOperationParamResolver', () => {
  const param = createOperationParamResolver()

  test('name uses the <operationId> <in> <name> template', () => {
    const parameter = ast.factory.createParameter({ name: 'pet-id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }) })
    expect(param.name.call(resolver, node, parameter)).toBe('ListPetsPathPetId')
    expect(operationParamName.call(resolver, node, parameter)).toBe('ListPetsPathPetId')
  })

  test('path/query/headers use the grouped templates', () => {
    expect(param.path.call(resolver, node)).toBe('ListPetsPath')
    expect(param.query.call(resolver, node)).toBe('ListPetsQuery')
    expect(param.headers.call(resolver, node)).toBe('ListPetsHeaders')
  })
})

describe('createOperationResponseResolver', () => {
  const response = createOperationResponseResolver()

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
    expect(file.baseName?.({ name: 'pet.petId', extname: '.ts' })).toBe('pet/PetId.ts')
  })

  test('baseName supports prefixed and suffixed casing', () => {
    const file = createCasedFile((part) => camelCase(part, { suffix: 'schema' }))
    expect(file.baseName?.({ name: 'tag.tag', extname: '.ts' })).toBe('tag/tagSchema.ts')
  })
})
