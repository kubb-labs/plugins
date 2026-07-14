/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: test case */

import { describe, expect, test } from 'vitest'
import { Url } from './url.ts'

describe('Url.toTemplateString', () => {
  test('renders path params as template literal interpolations', () => {
    expect(Url.toTemplateString('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')).toBe(
      '`/user/${userID}/monetary-account/${monetaryAccountID}/whitelist-sdd/${itemId}`',
    )
    expect(Url.toTemplateString('/user/{user_id}')).toBe('`/user/${user_id}`')
  })

  test('applies the replacer to each param', () => {
    expect(Url.toTemplateString('/user/{userID}', { replacer: (item) => `unref(${item})` })).toBe('`/user/${unref(userID)}`')
    expect(Url.toTemplateString('/user/{userID}')).toBe('`/user/${userID}`')
  })

  test('prepends the prefix inside the literal', () => {
    expect(Url.toTemplateString('/user/{userID}', { prefix: 'https://api' })).toBe('`https://api/user/${userID}`')
  })

  test('preserves a colon-suffix custom method (e.g. :search)', () => {
    // OpenAPI supports Google-style custom methods: /pet/{petId}:search
    // The :search suffix must NOT be treated as a route parameter
    expect(Url.toTemplateString('/pet/{petId}:search')).toBe('`/pet/${petId}:search`')
  })
})

describe('Url.toGroupedTemplateString', () => {
  test('reads each parameter off the grouped path option', () => {
    expect(Url.toGroupedTemplateString('/pet/{petId}')).toBe('`/pet/${path.petId}`')
  })

  test('prepends the prefix inside the literal', () => {
    expect(Url.toGroupedTemplateString('/pet/{petId}', { prefix: 'https://api' })).toBe('`https://api/pet/${path.petId}`')
  })
})

describe('Url.toSafeTemplate', () => {
  test('preserves already-valid identifier placeholder names, including snake_case', () => {
    expect(Url.toSafeTemplate('/projects/{project_id}')).toBe('/projects/{project_id}')
    expect(Url.toSafeTemplate('/user/{user_id}/posts/{post_id}')).toBe('/user/{user_id}/posts/{post_id}')
  })

  test('leaves already-camelCase and braceless paths unchanged', () => {
    expect(Url.toSafeTemplate('/pet/{petId}')).toBe('/pet/{petId}')
    expect(Url.toSafeTemplate('/health')).toBe('/health')
  })

  test('camelCases non-identifier placeholders such as kebab-case, as an identifier-safety fallback', () => {
    expect(Url.toSafeTemplate('/user/{monetary-account-id}')).toBe('/user/{monetaryAccountId}')
  })
})

describe('Url.toPath', () => {
  test('converts path params to Express-style colon syntax', () => {
    expect(Url.toPath('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')).toBe(
      '/user/:userID/monetary-account/:monetary-accountID/whitelist-sdd/:itemId',
    )
    expect(Url.toPath('/pet/{petId}:search')).toBe('/pet/:petId:search')
  })
})
