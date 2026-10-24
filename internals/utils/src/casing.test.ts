import { describe, expect, test } from 'vitest'
import { camelCase, capitalize, pascalCase, screamingSnakeCase, snakeCase } from './casing.ts'

describe('casing', () => {
  test.each([
    ['getPetById', 'GetPetById'],
    ['', ''],
  ])('capitalize(%s) -> %s', (input, expected) => {
    expect(capitalize(input)).toBe(expected)
  })

  test.each([
    // separators
    ['pet pet', 'petPet'],
    ['is HTML test', 'isHTMLTest'],
    ['aiType', 'aiType'],
    ['hello-world', 'helloWorld'],
    ['hello_world', 'helloWorld'],
    ['hello world', 'helloWorld'],
    // already camelCase / PascalCase input
    ['HelloWorld', 'helloWorld'],
    ['createPetById', 'createPetById'],
    // single word
    ['hello', 'hello'],
    ['a', 'a'],
    // all-caps acronym preserved
    ['HTML', 'HTML'],
    ['getHTTPSResponse', 'getHTTPSResponse'],
    // digit → letter boundary
    ['123invalid', '123Invalid'],
    ['get2pet', 'get2Pet'],
    // mixed separators
    ['hello-world_foo', 'helloWorldFoo'],
    // special chars stripped (@ is not a separator, just removed)
    ['hello@world', 'helloworld'],
    // dots are treated as a separator and collapsed into a single token
    ['pet.petId', 'petPetId'],
    // empty
    ['', ''],
  ])('camelCase(%s) -> %s', (input, expected) => {
    expect(camelCase(input)).toBe(expected)
  })

  test.each([
    ['tag', { prefix: 'create' }, 'createTag'],
    ['tag', { suffix: 'schema' }, 'tagSchema'],
    ['pet', { prefix: 'get', suffix: 'byId' }, 'getPetById'],
  ])('camelCase(%s, options) -> %s', (input, options, expected) => {
    expect(camelCase(input, options as Parameters<typeof camelCase>[1])).toBe(expected)
  })

  test('pascalCase', () => {
    expect(pascalCase('pet pet')).toBe('PetPet')
    expect(pascalCase('is HTML test')).toBe('IsHTMLTest')
    expect(pascalCase('aiType')).toBe('AiType')
  })

  test('snakeCase', () => {
    expect(snakeCase('petPet')).toBe('pet_pet')
    expect(snakeCase('created at')).toBe('created_at')
    expect(snakeCase('FILE.UPLOADED')).toBe('file_uploaded')
    expect(snakeCase('FILE.DOWNLOADED')).toBe('file_downloaded')
    expect(snakeCase('enum-value')).toBe('enum_value')
    expect(snakeCase('is HTML test')).toBe('is_html_test')
    expect(snakeCase('description')).toBe('description')
    expect(snakeCase('PetType')).toBe('pet_type')
    expect(snakeCase('tag', { prefix: 'create' })).toBe('create_tag')
    expect(snakeCase('tag', { suffix: 'schema' })).toBe('tag_schema')
  })

  test('screamingSnakeCase', () => {
    expect(screamingSnakeCase('petPet')).toBe('PET_PET')
    expect(screamingSnakeCase('tag', { prefix: 'create' })).toBe('CREATE_TAG')
    expect(screamingSnakeCase('tag', { suffix: 'schema' })).toBe('TAG_SCHEMA')
  })
})

describe('casing cache', () => {
  test('keeps camelCase and PascalCase results for the same text apart', () => {
    expect(camelCase('pet-store')).toBe('petStore')
    expect(pascalCase('pet-store')).toBe('PetStore')
    expect(camelCase('pet-store')).toBe('petStore')
  })
})
