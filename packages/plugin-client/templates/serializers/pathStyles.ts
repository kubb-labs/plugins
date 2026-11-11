import { toValue } from '../serializers.ts'
import type { PathSerializer } from '../serializers.ts'
import { serializePath } from './path.ts'

function encode(value: unknown): string {
  return encodeURIComponent(toValue(value))
}

/**
 * The path serializer for the OpenAPI `label` and `matrix` styles. A `simple` parameter uses `serializePath`.
 */
export const serializeStyledPath: PathSerializer = ({ name, value, options }) => {
  const style = options?.style ?? 'simple'
  if (style === 'simple' || value === undefined || value === null) return serializePath({ name, value, options })
  const explode = options?.explode ?? false
  const label = style === 'label'
  if (Array.isArray(value)) {
    const items = value.map(encode)
    if (label) return `.${items.join(explode ? '.' : ',')}`
    return explode ? items.map((item) => `;${name}=${item}`).join('') : `;${name}=${items.join(',')}`
  }
  // A `Date` is a unit, not an object to expand.
  if (typeof value === 'object' && !(value instanceof Date)) {
    const members = Object.entries(value).map(([key, item]) => `${encode(key)}${explode ? '=' : ','}${encode(item)}`)
    if (label) return `.${members.join(explode ? '.' : ',')}`
    return explode ? members.map((member) => `;${member}`).join('') : `;${name}=${members.join(',')}`
  }
  const encoded = encode(value)
  // RFC 6570 drops the `=` of an empty matrix value: `;color`.
  return label ? `.${encoded}` : encoded ? `;${name}=${encoded}` : `;${name}`
}
