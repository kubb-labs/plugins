import * as DateTime from 'effect/DateTime'
import * as Schema from 'effect/Schema'
import * as SchemaGetter from 'effect/SchemaGetter'
import { describe, expect, test } from 'vitest'
import type { Order as OrderType, Pet as PetType } from './gen/effect/index.ts'
import { GetThingsQueryLimit, Order, Pet, PhoneWithMaxLength } from './gen/effect/index.ts'

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false
type Expect<Value extends true> = Value

type _PetSchemaType = Expect<Equal<typeof Pet.Type, PetType>>
type _OrderSchemaType = Expect<Equal<typeof Order.Type, OrderType>>
type _OrderDecodedShipDate = Expect<Equal<NonNullable<OrderType['shipDate']>, DateTime.Utc>>
type _OrderEncodedShipDate = Expect<Equal<NonNullable<(typeof Order.Encoded)['shipDate']>, string>>

describe('generated Effect schemas', () => {
  test('decodes recursive schemas and strips excess properties', () => {
    const decoded = Schema.decodeUnknownSync(Pet)({
      name: 'Milo',
      photoUrls: [],
      parent: [{ name: 'Luna', photoUrls: [] }],
      ignored: true,
    })
    expect(decoded).toEqual({ name: 'Milo', photoUrls: [], parent: [{ name: 'Luna', photoUrls: [] }] })
  })

  test('enforces pattern, length, and numeric constraints', () => {
    expect(() => Schema.decodeUnknownSync(Pet)({ name: 'Milo', photoUrls: [], internalId: 'invalid' })).toThrow()
    expect(() => Schema.decodeUnknownSync(PhoneWithMaxLength)('+123 1234 5678 9012')).toThrow()
    expect(() => Schema.decodeUnknownSync(GetThingsQueryLimit)(101)).toThrow()
  })

  test('keeps format and default metadata annotation-only', () => {
    const FormatOnly = Schema.String.annotate({ format: 'email' })
    expect(Schema.decodeUnknownSync(FormatOnly)('not-an-email')).toBe('not-an-email')
    expect(Schema.decodeUnknownSync(GetThingsQueryLimit)(undefined)).toBeUndefined()
  })

  test('round-trips encoded date-time strings', () => {
    const decoded = Schema.decodeUnknownSync(Order)({ shipDate: '2026-07-14T10:30:00.000Z' })
    if (!decoded.shipDate) throw new Error('Expected shipDate to be decoded')
    expect(DateTime.isUtc(decoded.shipDate)).toBe(true)
    expect(DateTime.formatIso(decoded.shipDate)).toBe('2026-07-14T10:30:00.000Z')
    expect(Schema.encodeUnknownSync(Order)(decoded)).toEqual({ shipDate: '2026-07-14T10:30:00.000Z' })
  })

  test('round-trips date-only strings without adding a time component', () => {
    const DateOnly = Schema.String.pipe(
      Schema.decodeTo(Schema.DateValid, {
        decode: SchemaGetter.transform((value) => new Date(`${value}T00:00:00.000Z`)),
        encode: SchemaGetter.transform((value) => value.toISOString().slice(0, 10)),
      }),
    )
    const decoded = Schema.decodeUnknownSync(DateOnly)('2026-07-14')
    expect(Schema.encodeUnknownSync(DateOnly)(decoded)).toBe('2026-07-14')
  })
})
