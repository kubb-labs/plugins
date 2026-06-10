import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { resolverClient } from './resolverClient.ts'

describe('resolverClient.resolveGroupName', () => {
  test('appends a Client suffix so the tag class never collides with the schema model', () => {
    // Regression for https://github.com/kubb-labs/plugins/issues/331: the petstore tag
    // `pet` and schema `Pet` share a name, so the class needs a distinct identifier to
    // coexist with the model type in the barrel.
    expect(resolverClient.resolveGroupName('pet')).toBe('PetClient')
    expect(resolverClient.resolveGroupName('pet')).not.toBe(resolverTs.resolveTypeName('pet'))
  })

  test('pascal-cases multi-word tags before suffixing', () => {
    expect(resolverClient.resolveGroupName('pet-store')).toBe('PetStoreClient')
  })

  test('keeps the result a valid variable name for tags starting with a digit', () => {
    expect(resolverClient.resolveGroupName('2legged')).toBe('_2LeggedClient')
  })
})
