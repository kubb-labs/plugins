import * as yaml from 'yaml'

/**
 * A range in the spec text, as `[start, end)` offsets.
 */
export type Range = { start: number; end: number }

const toRange = ([start, end]: yaml.Range): Range => ({ start, end })

const unescapeToken = (token: string) => token.replaceAll('~1', '/').replaceAll('~0', '~')

/** Walks a JSON pointer through maps and sequences; the range is the last key or item it reached. */
function findPointer(document: yaml.Document, pointer: string): Range | undefined {
  const tokens = pointer.replace(/^#/, '').split('/').slice(1).map(unescapeToken)
  return tokens.reduce<{ node: unknown; range: Range | undefined } | undefined>(
    (at, token) => {
      if (yaml.isMap(at?.node)) {
        const pair = at.node.items.find((item) => yaml.isScalar(item.key) && String(item.key.value) === token)
        return pair && yaml.isScalar(pair.key) && pair.key.range ? { node: pair.value, range: toRange(pair.key.range) } : undefined
      }
      if (yaml.isSeq(at?.node)) {
        const item = at.node.items[Number(token)]
        return yaml.isNode(item) && item.range ? { node: item, range: toRange(item.range) } : undefined
      }
      return undefined
    },
    { node: document.contents, range: undefined },
  )?.range
}

/** The first `$ref` whose value is `ref`. */
function findRefUsage(document: yaml.Document, ref: string): Range | undefined {
  let found: Range | undefined
  yaml.visit(document, {
    Pair(_, { key, value }) {
      if (!yaml.isScalar(key) || key.value !== '$ref' || !yaml.isScalar(value) || value.value !== ref || !value.range) return
      found = toRange(value.range)
      return yaml.visit.BREAK
    },
  })
  return found
}

/**
 * Maps JSON pointers to ranges in an already parsed spec, the same way `@kubb/adapter-oas`'s
 * `locate` does from the spec text. Reusing the document the build parsed saves a second parse of
 * the spec on every transform. An unresolved `$ref` falls back to its first usage.
 */
export function createLocator(document: yaml.Document): (location: { pointer: string; ref?: string }) => Range | undefined {
  return ({ pointer, ref }) => findPointer(document, pointer) ?? (ref ? findRefUsage(document, ref) : undefined)
}
