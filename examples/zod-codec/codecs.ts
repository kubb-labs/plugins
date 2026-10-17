import type { PrinterZodNodes } from '@kubb/plugin-zod'

/**
 * Custom codecs, one per format, branching on the direction: request (encode) schemas take the domain value
 * and transform it to the wire value, response (decode) schemas transform the wire value back.
 * - `format: uri` (`url` node): `URL` <-> its string
 * - `format: int64` (`bigint` node): `bigint` <-> its decimal string
 * - `format: date` (`date` node): `Date` <-> `YYYY-MM-DD`
 * - `format: date-time` (`datetime` node): `Date` <-> ISO date-time
 */
export const customCodecs: PrinterZodNodes = {
  url() {
    return this.options.direction === 'encode' ? 'z.instanceof(URL).transform((url) => url.href)' : 'z.url().transform((value) => new URL(value))'
  },
  bigint() {
    return this.options.direction === 'encode' ? 'z.bigint().transform((value) => value.toString())' : 'z.string().transform((value) => BigInt(value))'
  },
  date() {
    return this.options.direction === 'encode'
      ? 'z.date().transform((value) => value.toISOString().slice(0, 10))'
      : 'z.iso.date().transform((value) => new Date(value))'
  },
  datetime() {
    return this.options.direction === 'encode' ? 'z.date().transform((value) => value.toISOString())' : 'z.iso.datetime().transform((value) => new Date(value))'
  },
}
