/**
 * Direct renderer comparison — no full build pipeline overhead.
 *
 * Renders 236 representative JSX elements (one per schema, matching plugin-ts output
 * structure) with each renderer variant:
 *
 *   react-legacy  LegacyRoot + isPrimaryRenderer:false  (current local package)
 *   sync          Custom synchronous recursive renderer (no reconciler)
 *
 * Each iteration creates a fresh renderer instance and renders 236 elements,
 * matching the workload of a twitter.json build with plugin-ts.
 *
 * Run with:  pnpm test:bench
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { File, jsxRenderer, jsxRendererSync } from '@kubb/renderer-jsx'
import { bench, describe } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Representative JSX element matching plugin-ts schema output:
//   <File> with 1-3 imports, 1 <File.Source> containing a type alias string
function makeSchemaElement(i: number) {
  const name = `Schema${i}`
  const typeDef = i % 3 === 0
    ? `export type ${name} = { id: number; name: string; status: 'active' | 'inactive' | 'pending'; description?: string | undefined; tags: Array<string>; metadata: Record<string, unknown> }`
    : i % 3 === 1
      ? `export type ${name} = ${name}Base & { createdAt: string; updatedAt: string }`
      : `export type ${name} = Array<${name}Item>`

  return (
    <File baseName={`${name}.ts`} path={`types/${name}.ts`}>
      <File.Import isTypeOnly name={[`${name}Base`]} path={`./base`} />
      <File.Import isTypeOnly name={[`${name}Item`]} path={`./item`} />
      <File.Source>
        {typeDef}
      </File.Source>
    </File>
  )
}

const SCHEMA_COUNT = 236
const elements = Array.from({ length: SCHEMA_COUNT }, (_, i) => makeSchemaElement(i))

describe(`Renderer comparison — ${SCHEMA_COUNT} schema elements (plugin-ts shape)`, () => {
  bench('react-legacy  (LegacyRoot, isPrimary:false)', async () => {
    const renderer = jsxRenderer()
    for (const el of elements) await renderer.render(el)
    renderer.unmount()
  }, { iterations: 5, warmupIterations: 1 })

  bench('sync          (no reconciler, direct walk)', async () => {
    const renderer = jsxRendererSync()
    for (const el of elements) await renderer.render(el)
    renderer.unmount()
  }, { iterations: 5, warmupIterations: 1 })
})
