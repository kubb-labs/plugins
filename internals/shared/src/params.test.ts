import { describe, expect, it } from 'vitest'
import { ast } from 'kubb/kit'
import { dedupeParams } from './params.ts'

const { createParameter, createSchema } = ast.factory

const param = (name: string) =>
  createParameter({
    name,
    in: 'query',
    required: false,
    schema: createSchema({ type: 'string' }),
  })

describe('dedupeParams', () => {
  it('drops params that share the same name, keeping the first', () => {
    const result = dedupeParams([param('max-uploads'), param('prefix'), param('max-uploads')])

    expect(result.map((p) => p.name)).toStrictEqual(['max-uploads', 'prefix'])
  })

  it('keeps params with distinct names, even when they would collide once camelCased', () => {
    const result = dedupeParams([param('max-uploads'), param('MaxUploads')])

    expect(result.map((p) => p.name)).toStrictEqual(['max-uploads', 'MaxUploads'])
  })

  it('handles an empty params array', () => {
    expect(dedupeParams([])).toStrictEqual([])
  })
})
