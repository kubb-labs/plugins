import { ast } from '@internals/ast'
import { describe, expect, test } from 'vitest'
import { aliasConflictingImports, filterUsedImports, rewriteAliasedImports } from './imports.ts'

const imp = (names: Array<ast.ModuleName>, path: string) => ast.factory.createImport({ names, path })
const createPet = imp([{ name: 'createPet' }], './pet.ts')

describe('import utilities', () => {
  test('filters imports used as function calls', () => {
    const makeUser = imp([{ name: 'createUser', alias: 'makeUser' }], './user.ts')
    const imports = [createPet, imp([{ name: 'unused' }], './unused.ts'), makeUser]

    expect(filterUsedImports(imports, 'createPet(data); makeUser<object>(); const value = unused')).toStrictEqual([createPet, makeUser])
  })

  test('ignores names that only appear inside a longer call', () => {
    expect(filterUsedImports([createPet], 'createPetList(data); x.createPet (1)')).toStrictEqual([createPet])
    expect(filterUsedImports([createPet], 'createPetList(data); recreatePet()')).toStrictEqual([])
  })

  test('keeps no imports when the text calls nothing', () => {
    expect(filterUsedImports([createPet], 'undefined')).toStrictEqual([])
  })

  test('skips selected import names', () => {
    expect(filterUsedImports([createPet], 'createPet(data)', ['createPet'])).toStrictEqual([])
  })

  test('aliases conflicting string imports', () => {
    const store = imp([{ name: 'createStore', alias: 'storeFactory' }], './store.ts')
    const { imports, aliases } = aliasConflictingImports([imp([{ name: 'createPet' }, { name: 'createUser' }], './api.ts'), store], ['createPet'])

    expect(imports.map((entry) => ast.file.getNames(entry))).toStrictEqual([
      [{ name: 'createPet', alias: 'createPetSchema' }, { name: 'createUser' }],
      ast.file.getNames(store),
    ])
    expect(aliases).toStrictEqual(new Map([['createPet', 'createPetSchema']]))
  })

  test('rewrites aliased import references', () => {
    expect(rewriteAliasedImports('return createPet(data)', new Map([['createPet', 'createPetSchema']]))).toBe('return createPetSchema(data)')
  })
})
