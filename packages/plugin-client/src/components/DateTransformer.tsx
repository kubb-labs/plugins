import { File, Function } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

/**
 * A single generated transformer/serializer function: its exported name and body.
 */
export type TransformerFn = {
  name: string
  body: string
}

type Props = {
  functions: Array<TransformerFn>
}

/**
 * Renders the generated date transformer/serializer functions. Each function is
 * generic (`<T>(data: T): T`) so it preserves the caller's type without importing
 * the generated TypeScript types.
 */
export function DateTransformer({ functions }: Props): KubbReactNode {
  return (
    <>
      {functions.map((fn) => (
        <File.Source key={fn.name} name={fn.name} isExportable isIndexable={false}>
          <Function name={fn.name} export generics={['T']} params="data: T" returnType="T">
            {fn.body}
          </Function>
        </File.Source>
      ))}
    </>
  )
}
