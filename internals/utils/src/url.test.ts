/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: test case */

import { describe, expect, test } from 'vitest'
import { toTemplateString, toURLObject, toURLPath } from './url.ts'

describe('toTemplateString', () => {
  test('renders path params as template literal interpolations', () => {
    expect(toTemplateString('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')).toBe(
      '`/user/${userID}/monetary-account/${monetaryAccountID}/whitelist-sdd/${itemId}`',
    )
    expect(toTemplateString('/user/{user_id}')).toBe('`/user/${user_id}`')
  })

  test('applies the replacer to each param', () => {
    expect(toTemplateString('/user/{userID}', { replacer: (item) => `unref(${item})` })).toBe('`/user/${unref(userID)}`')
    expect(toTemplateString('/user/{userID}')).toBe('`/user/${userID}`')
  })

  test('prepends the prefix inside the literal', () => {
    expect(toTemplateString('/user/{userID}', { prefix: 'https://api' })).toBe('`https://api/user/${userID}`')
  })

  test('preserves a colon-suffix custom method (e.g. :search)', () => {
    // OpenAPI supports Google-style custom methods: /pet/{petId}:search
    // The :search suffix must NOT be treated as a route parameter
    expect(toTemplateString('/pet/{petId}:search')).toBe('`/pet/${petId}:search`')
  })
})

describe('toURLPath', () => {
  test('converts path params to Express-style colon syntax', () => {
    expect(toURLPath('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')).toBe(
      '/user/:userID/monetary-account/:monetary-accountID/whitelist-sdd/:itemId',
    )
    expect(toURLPath('/pet/{petId}:search')).toBe('/pet/:petId:search')
  })
})

describe('toURLObject', () => {
  test('returns url and params for an Express path', () => {
    expect(toURLObject('/user/{userID}')).toStrictEqual({
      url: '/user/:userID',
      params: { userID: 'userID' },
    })
  })

  test('returns url as a template literal when requested', () => {
    expect(toURLObject('/user/{userID}', { type: 'template' })).toStrictEqual({
      url: '`/user/${userID}`',
      params: { userID: 'userID' },
    })
  })

  test('serializes to a string expression when stringify is set', () => {
    expect(toURLObject('/user/{userID}', { type: 'template', stringify: true })).toBe('{url:`/user/${userID}`,params:{userID:userID}}')
  })

  test('returns null params and omits them when the path has none', () => {
    expect(toURLObject('/test')).toStrictEqual({
      url: '/test',
      params: null,
    })
    expect(toURLObject('/test', { type: 'template', stringify: true })).toMatchInlineSnapshot(`"{url:\`/test\`,params:null}"`)
  })

  test('preserves a colon-suffix custom method (e.g. :search)', () => {
    expect(toURLObject('/pet/{petId}:search')).toStrictEqual({
      url: '/pet/:petId:search',
      params: { petId: 'petId' },
    })
  })
})
