/**
 * Runtime helpers used by the generated date transformers (`coerceDates`).
 *
 * Each helper is a no-op when the value is not the expected runtime shape, so
 * the generated transformers stay null-safe and idempotent.
 */

/**
 * Response direction: parse an incoming ISO string into a `Date`.
 * Leaves non-strings (including `null`/`undefined` and existing `Date`s) untouched.
 */
export function toDate(value: unknown): unknown {
  return typeof value === 'string' ? new Date(value) : value
}

/**
 * Request direction for `format: date-time`: serialize a `Date` to a full ISO string.
 */
export function toISO(value: unknown): unknown {
  return value instanceof Date ? value.toISOString() : value
}

/**
 * Request direction for `format: date`: serialize a `Date` to `YYYY-MM-DD`.
 */
export function toDateISO(value: unknown): unknown {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value
}

/**
 * Request direction for `format: time`: serialize a `Date` to `HH:mm:ss`.
 */
export function toTimeISO(value: unknown): unknown {
  return value instanceof Date ? value.toISOString().slice(11, 19) : value
}
