import type { ast } from '@kubb/core'

/**
 * A round-trip boundary: a schema node whose runtime type differs from its JSON
 * wire type, so the output (response) schema must decode wire → runtime and the
 * input (request) variant must encode runtime → wire.
 *
 * To support another round-trip type, append a `RoundTripEntry` to `roundTripEntries`
 * and route that type's printer node handler through `getRoundTripEntry`.
 */
export type RoundTripEntry = {
  /**
   * Whether this node is a round-trip boundary handled by this entry.
   */
  matches(node: ast.SchemaNode): boolean
  /**
   * Output direction (response): decode the wire value into the runtime type.
   */
  decode(node: ast.SchemaNode): string
  /**
   * Input direction (request): encode the runtime value back to the wire value.
   */
  encode(node: ast.SchemaNode): string
}

/**
 * `dateType: 'date'` fields are typed as `Date` but travel as ISO `string`s.
 * Output decodes `string → Date`; input encodes `Date → string`, preserving the
 * `date` (`YYYY-MM-DD`) vs `date-time` precision carried on `node.format`.
 */
const dateRoundTrip: RoundTripEntry = {
  matches(node) {
    return node.type === 'date' && node.representation === 'date'
  },
  decode(node) {
    return node.format === 'date' ? 'z.iso.date().transform((value) => new Date(value))' : 'z.iso.datetime().transform((value) => new Date(value))'
  },
  encode(node) {
    return node.format === 'date' ? 'z.date().transform((value) => value.toISOString().slice(0, 10))' : 'z.date().transform((value) => value.toISOString())'
  },
}

/**
 * Registered round-trip boundaries, checked in order.
 */
const roundTripEntries: Array<RoundTripEntry> = [dateRoundTrip]

/**
 * Returns the round-trip entry handling this node, or `undefined` when the node
 * needs no encode/decode (its wire and runtime types match).
 */
export function getRoundTripEntry(node: ast.SchemaNode | undefined): RoundTripEntry | undefined {
  if (!node) return undefined
  return roundTripEntries.find((entry) => entry.matches(node))
}

/**
 * Returns `true` when the node itself is a round-trip boundary.
 */
export function isRoundTripNode(node: ast.SchemaNode | undefined): boolean {
  return getRoundTripEntry(node) !== undefined
}
