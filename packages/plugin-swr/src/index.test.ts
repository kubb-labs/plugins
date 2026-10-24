import * as tanstackQuery from '@internals/tanstack-query'
import { describe, expect, test } from 'vitest'
import { mutationKeyTransformer, queryKeyTransformer } from './index.ts'

describe('@kubb/plugin-swr', () => {
  test('exports the default key transformers', () => {
    expect(queryKeyTransformer).toBe(tanstackQuery.queryKeyTransformer)
    expect(mutationKeyTransformer).toBe(tanstackQuery.mutationKeyTransformer)
  })
})
