import { describe, expect, test } from 'vitest'
import { aliasConflictingImports, filterUsedImports, rewriteAliasedImports } from './imports.ts'
import type { ImportEntry } from './imports.ts'

describe('import utilities', () => {
  test('filters imports used as function calls', () => {
    const imports: Array<ImportEntry> = [
      { name: 'createPet', path: './pet.ts' },
      { name: 'unused', path: './unused.ts' },
      { name: [{ propertyName: 'createUser', name: 'makeUser' }], path: './user.ts' },
    ]

    expect(filterUsedImports(imports, 'createPet(data); makeUser(data); const value = unused')).toMatchInlineSnapshot(`
      [
        {
          "name": "createPet",
          "path": "./pet.ts",
        },
        {
          "name": [
            {
              "name": "makeUser",
              "propertyName": "createUser",
            },
          ],
          "path": "./user.ts",
        },
      ]
    `)
  })

  test('skips selected import names', () => {
    expect(filterUsedImports([{ name: 'createPet', path: './pet.ts' }], 'createPet(data)', ['createPet'])).toStrictEqual([])
  })

  test('aliases conflicting string imports', () => {
    const importEntries: Array<ImportEntry> = [
      { name: ['createPet', 'createUser'], path: './api.ts' },
      { name: [{ propertyName: 'createStore', name: 'storeFactory' }], path: './store.ts' },
    ]

    const { imports, aliases } = aliasConflictingImports(importEntries, ['createPet'])

    expect(imports).toMatchInlineSnapshot(`
      [
        {
          "name": [
            {
              "name": "createPetSchema",
              "propertyName": "createPet",
            },
            "createUser",
          ],
          "path": "./api.ts",
        },
        {
          "name": [
            {
              "name": "storeFactory",
              "propertyName": "createStore",
            },
          ],
          "path": "./store.ts",
        },
      ]
    `)
    expect(aliases).toStrictEqual(new Map([['createPet', 'createPetSchema']]))
  })

  test('rewrites aliased import references', () => {
    expect(rewriteAliasedImports('return createPet(data)', new Map([['createPet', 'createPetSchema']]))).toBe('return createPetSchema(data)')
  })
})
