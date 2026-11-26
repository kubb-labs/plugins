import { ast } from '@internals/ast'
import { describe, expect, test } from 'vitest'
import { createImportAliases, filterUsedImports } from './imports.ts'

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

  test('aliases the imports that clash with a local helper and rewrites their calls', () => {
    const store = imp([{ name: 'createStore', alias: 'storeFactory' }], './store.ts')
    const aliases = createImportAliases({ imports: [imp([{ name: 'createPet' }, { name: 'createUser' }], './api.ts'), store], reservedNames: ['createPet'] })

    expect(aliases.imports.map((entry) => ast.file.getNames(entry))).toStrictEqual([
      [{ name: 'createPet', alias: 'createPetSchema' }, { name: 'createUser' }],
      ast.file.getNames(store),
    ])
    expect(aliases.rewrite('return { createPet: createPet(data), list: createPetList() }')).toBe(
      'return { createPet: createPetSchema(data), list: createPetList() }',
    )
  })
})
