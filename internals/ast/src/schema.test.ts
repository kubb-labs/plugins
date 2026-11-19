import { describe, expect, it } from 'vitest'
import { getNumberBounds } from './schema.ts'

describe('schema.getNumberBounds', () => {
  it.each([
    [{ min: 1, max: 5 }, {}, { min: 1, max: 5 }],
    [{ exclusive: { min: 2, max: 8 } }, { integer: true }, { min: 3, max: 7 }],
    [{ min: 1.2, max: 4.8 }, { integer: true }, { min: 2, max: 4 }],
    [{ exclusive: { min: 0 } }, { integer: true, step: 5 }, { min: 5 }],
    [{ min: 0, exclusive: { min: 3 } }, { integer: true }, { min: 4 }],
    [{ min: -(2 ** 63), max: 2 ** 63 }, { integer: true }, {}],
    [{ exclusive: { min: 0.5 } }, {}, { min: 0.5 }],
  ] as const)('getNumberBounds(%o, %o) is %o', (node, options, expected) => {
    expect(getNumberBounds({ ...node, ...options })).toStrictEqual(expected)
  })
})

describe('schema.getNumberBounds on a number node', () => {
  it.each([
    [
      { type: 'integer', format: 'int32', min: 0 },
      { min: 0, max: 2_147_483_647 },
    ],
    [
      { type: 'integer', format: 'uint8', max: 1000 },
      { min: 0, max: 255 },
    ],
    [{ type: 'integer', format: 'int64' }, {}],
    [{ type: 'number', format: 'int32' }, {}],
    [
      { type: 'bigint', min: 1.5, multipleOf: 2 },
      { min: 2, multipleOf: 2 },
    ],
    [{ type: 'bigint', multipleOf: 2 ** 60 }, {}],
    [{ type: 'number', multipleOf: 0.5 }, { multipleOf: 0.5 }],
  ] as const)('getNumberBounds(%o) is %o', (node, expected) => {
    expect(getNumberBounds(node)).toStrictEqual(expected)
  })
})
