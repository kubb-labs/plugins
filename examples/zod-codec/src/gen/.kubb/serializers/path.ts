import type { PathSerializer } from '../serializers.ts'
import { encodeComponent, isRecord } from '../serializers.ts'

/** The path serializer for the `simple` style, which `serializeStyledPath` also uses. */
export const serializePath: PathSerializer = ({ name, value, options }) => {
  if (value === undefined || value === null) return ''
  if (options?.style && options.style !== 'simple') {
    throw new TypeError(`Cannot send path parameter ${name} with the ${options.style} style, register serializer.path on the client.`)
  }
  if (Array.isArray(value)) return value.map(encodeComponent).join(',')
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${encodeComponent(key)}${options?.explode ? '=' : ','}${encodeComponent(item)}`)
      .join(',')
  }
  return encodeComponent(value)
}
