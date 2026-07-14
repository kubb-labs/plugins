import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { resolverEffectHttpApiClient } from './resolverEffectHttpApiClient.ts'

describe('resolverEffectHttpApiClient', () => {
  test('resolves endpoint, group, API, and client names', () => {
    const operation = ast.factory.createOperation({ operationId: 'get pet by id', method: 'GET', path: '/pets/{id}', responses: [] })

    expect(resolverEffectHttpApiClient.endpoint.name(operation)).toBe('getPetByIdEndpoint')
    expect(resolverEffectHttpApiClient.endpoint.identifier(operation)).toBe('getPetById')
    expect(resolverEffectHttpApiClient.group.name('pet store')).toBe('PetStoreGroup')
    expect(resolverEffectHttpApiClient.group.identifier('pet store')).toBe('petStore')
    expect(resolverEffectHttpApiClient.api.name()).toBe('Api')
    expect(resolverEffectHttpApiClient.client.name()).toBe('ApiClient')
  })
})
