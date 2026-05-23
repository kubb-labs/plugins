import { describe, expect, it } from 'vitest'
import { toDate, toDateISO, toISO, toTimeISO } from './dates'

describe('toDate', () => {
  it('parses an ISO string into a Date', () => {
    expect(toDate('2024-01-15T10:30:00.000Z')).toEqual(new Date('2024-01-15T10:30:00.000Z'))
  })

  it('leaves non-strings untouched', () => {
    const date = new Date('2024-01-15T10:30:00.000Z')
    expect(toDate(date)).toBe(date)
    expect(toDate(null)).toBe(null)
    expect(toDate(undefined)).toBe(undefined)
    expect(toDate(42)).toBe(42)
  })
})

describe('toISO', () => {
  it('serializes a Date to a full ISO string', () => {
    expect(toISO(new Date('2024-01-15T10:30:00.000Z'))).toBe('2024-01-15T10:30:00.000Z')
  })

  it('leaves non-Dates untouched', () => {
    expect(toISO('2024-01-15')).toBe('2024-01-15')
    expect(toISO(null)).toBe(null)
    expect(toISO(undefined)).toBe(undefined)
  })
})

describe('toDateISO', () => {
  it('serializes a Date to YYYY-MM-DD', () => {
    expect(toDateISO(new Date('2024-01-15T10:30:00.000Z'))).toBe('2024-01-15')
  })

  it('leaves non-Dates untouched', () => {
    expect(toDateISO('2024-01-15')).toBe('2024-01-15')
    expect(toDateISO(null)).toBe(null)
  })
})

describe('toTimeISO', () => {
  it('serializes a Date to HH:mm:ss', () => {
    expect(toTimeISO(new Date('2024-01-15T10:30:45.000Z'))).toBe('10:30:45')
  })

  it('leaves non-Dates untouched', () => {
    expect(toTimeISO('10:30:45')).toBe('10:30:45')
    expect(toTimeISO(undefined)).toBe(undefined)
  })
})
