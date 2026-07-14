import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { resolverEffect } from './resolverEffect.ts'

describe('resolverEffect', () => {
  test('uses PascalCase for schemas and files', () => {
    expect(resolverEffect.name('pet status')).toBe('PetStatus')
    expect(resolverEffect.file({ name: 'pet status', extname: '.ts', root: '.', output: { path: 'effect' } }).baseName).toBe('PetStatus.ts')
  })

  test('uses operation response conventions', () => {
    const operation = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets', responses: [] })
    expect(resolverEffect.response.status(operation, '200')).toBe('ListPetsStatus200')
    expect(resolverEffect.response.error(operation)).toBe('ListPetsError')
  })
})
