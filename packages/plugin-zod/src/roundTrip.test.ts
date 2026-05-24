import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { getRoundTripEntry, isRoundTripNode } from './roundTrip.ts'

describe('roundTrip', () => {
  test('date-time with representation "date" decodes and encodes', () => {
    const node = ast.createSchema({ type: 'date', representation: 'date', format: 'date-time' })

    const entry = getRoundTripEntry(node)
    expect(isRoundTripNode(node)).toBe(true)
    expect(entry?.decode(node)).toBe('z.iso.datetime().transform((value) => new Date(value))')
    expect(entry?.encode(node)).toBe('z.date().transform((value) => value.toISOString())')
  })

  test('date with representation "date" preserves YYYY-MM-DD precision', () => {
    const node = ast.createSchema({ type: 'date', representation: 'date', format: 'date' })

    const entry = getRoundTripEntry(node)
    expect(entry?.decode(node)).toBe('z.iso.date().transform((value) => new Date(value))')
    expect(entry?.encode(node)).toBe('z.date().transform((value) => value.toISOString().slice(0, 10))')
  })

  test('date with representation "string" is not a round-trip boundary', () => {
    const node = ast.createSchema({ type: 'date', representation: 'string', format: 'date-time' })

    expect(isRoundTripNode(node)).toBe(false)
    expect(getRoundTripEntry(node)).toBeUndefined()
  })

  test('non-registered types are not round-trip boundaries', () => {
    expect(isRoundTripNode(ast.createSchema({ type: 'bigint' }))).toBe(false)
    expect(isRoundTripNode(ast.createSchema({ type: 'string' }))).toBe(false)
    expect(isRoundTripNode(undefined)).toBe(false)
  })
})
