import { describe, expect, test } from 'vitest'
import { capitalize, screamingSnakeCase, snakeCase } from './casing.ts'

describe('casing', () => {
  test.each([
    ['getPetById', 'GetPetById'],
    ['', ''],
  ])('capitalize(%s) -> %s', (input, expected) => {
    expect(capitalize(input)).toBe(expected)
  })

  test.each([
    // separators
    ['created at', 'created_at'],
    ['enum-value', 'enum_value'],
    ['FILE.UPLOADED', 'file_uploaded'],
    ['pets/{id}:list', 'pets_id_list'],
    // camelCase and PascalCase input
    ['petPet', 'pet_pet'],
    ['PetType', 'pet_type'],
    // acronyms, including plurals and a lowercase run after them
    ['is HTML test', 'is_html_test'],
    ['HTTPResponse', 'http_response'],
    ['userIDs', 'user_ids'],
    ['URLs', 'urls'],
    ['OAuth2Token', 'oauth2_token'],
    // a digit followed by an uppercase word starts a new word, a digit-letter token stays whole
    ['sensor2Reading', 'sensor2_reading'],
    ['v1alpha1', 'v1alpha1'],
    ['COOL_2D_DRAWING', 'cool_2d_drawing'],
    // single word and empty
    ['description', 'description'],
    ['', ''],
  ])('snakeCase(%s) -> %s', (input, expected) => {
    expect(snakeCase(input)).toBe(expected)
  })

  test.each([
    ['petPet', 'PET_PET'],
    ['sensor2Reading', 'SENSOR2_READING'],
    ['HTTPResponse', 'HTTP_RESPONSE'],
  ])('screamingSnakeCase(%s) -> %s', (input, expected) => {
    expect(screamingSnakeCase(input)).toBe(expected)
  })

  test.each(['cool_2d_drawing', 'ranked_3rd_place', 'sensor2_reading', 'v1alpha1', '2fa', 'a'])('snakeCase keeps %s unchanged', (input) => {
    expect(snakeCase(input)).toBe(input)
  })

  test.each(['COOL_2D_DRAWING', 'NICE_3D_MODEL', 'RANKED_3RD_PLACE', 'SENSOR2_READING', 'HTTP_RESPONSE', '2FA', 'A'])(
    'screamingSnakeCase keeps %s unchanged',
    (input) => {
      expect(screamingSnakeCase(input)).toBe(input)
    },
  )

  test('snake case with a prefix or suffix', () => {
    expect(snakeCase('tag', { prefix: 'create' })).toBe('create_tag')
    expect(snakeCase('tag', { suffix: 'schema' })).toBe('tag_schema')
    expect(screamingSnakeCase('tag', { prefix: 'create' })).toBe('CREATE_TAG')
    expect(screamingSnakeCase('tag', { suffix: 'schema' })).toBe('TAG_SCHEMA')
  })
})
