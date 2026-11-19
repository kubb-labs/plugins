import { describe, expect, it } from 'vitest'
import { ast } from '@kubb/ast'
import { containsCircular } from './graph.ts'

const { createProperty, createSchema } = ast.factory

describe('containsCircular', () => {
  it('returns true when a nested ref points to a circular schema', () => {
    const schema = createSchema({
      type: 'object',
      name: 'Cat',
      properties: [
        createProperty({
          name: 'archEnemy',
          required: false,
          schema: createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
        }),
      ],
    })

    expect(containsCircular(schema, { circularSchemas: new Set(['Pet']) })).toBe(true)
  })

  it('returns false when excludeName matches the only circular ref', () => {
    const schema = createSchema({
      type: 'object',
      name: 'TreeNode',
      properties: [
        createProperty({
          name: 'left',
          required: false,
          schema: createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
        }),
      ],
    })

    expect(containsCircular(schema, { circularSchemas: new Set(['TreeNode']), excludeName: 'TreeNode' })).toBe(false)
  })
})
