import { describe, expect, test } from 'vitest'
import { Resolver } from 'kubb/kit'
import { toFilePath } from './fs.ts'

const { camelCase, pascalCase } = new Resolver({ pluginName: 'test' })

describe('toFilePath', () => {
  test.each([
    // version numbers (dot before a digit) stay in one segment
    ['get_enterprise_configurations_id_v2025.0', 'getEnterpriseConfigurationsIdV20250'],
    ['some_operation_v3.14', 'someOperationV314'],
    ['version.1.2.3', 'version123'],
    // dots before a letter split into nested path segments
    ['pet.petId', 'pet/petId'],
    ['pet.Pet', 'pet/pet'],
    ['api.v2', 'api/v2'],
    // Security: leading dots must NOT produce a leading slash (path traversal guard)
    ['..Schema', 'schema'],
    ['...Schema', 'schema'],
    ['.Internal', 'internal'],
  ])('toFilePath(%s) -> %s (camelCase segments)', (input, expected) => {
    expect(toFilePath(input, camelCase, camelCase)).toBe(expected)
  })

  test('cases the last segment with the provided caser', () => {
    expect(toFilePath('pet.petId', pascalCase, camelCase)).toBe('pet/PetId')
    expect(toFilePath('pet.Pet', pascalCase, camelCase)).toBe('pet/Pet')
  })

  test('applies prefix and suffix to the last segment only', () => {
    expect(toFilePath('create tag.tag', (part) => camelCase(part, { prefix: 'create' }), camelCase)).toBe('createTag/createTag')
    expect(toFilePath('tag.tag', (part) => camelCase(part, { suffix: 'schema' }), camelCase)).toBe('tag/tagSchema')
  })
})
