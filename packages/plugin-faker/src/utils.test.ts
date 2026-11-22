import { ast } from '@internals/ast'
import { describe, expect, it } from 'vitest'
import { resolveTypeReference } from './utils.ts'

describe('resolveTypeReference', () => {
  const node = ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [] })
  const typeImport = ast.factory.createImport({ name: ['Pet'], path: '/gen/types/Pet.ts' })

  it('names a type that shares the faker name inline through its import path', () => {
    const type = { name: 'Pet', import: typeImport, toString: () => 'Pet' }

    expect(resolveTypeReference({ node, canOverride: true, name: 'Pet', type, filePath: '/gen/mocks/Pet.ts' })).toStrictEqual({
      import: null,
      typeName: "import('../types/Pet.ts').Pet",
    })
  })

  it('keeps the plain type name when the type has no import', () => {
    const type = { name: 'Pet', import: null, toString: () => 'Pet' }

    expect(resolveTypeReference({ node, canOverride: true, name: 'Pet', type, filePath: '/gen/mocks/Pet.ts' })).toStrictEqual({ import: null, typeName: 'Pet' })
  })
})
