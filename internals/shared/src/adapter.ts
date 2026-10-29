import { type Adapter, Diagnostics } from '@kubb/kit'
import type { AdapterOas } from '@kubb/adapter-oas'

/**
 * Narrows the generic `Adapter` from a generator context to the OpenAPI adapter,
 * so OAS-only options (`dateType`, `enums`) and the parsed `document` are typed.
 *
 * Throws when a non-OAS adapter is configured, turning a silently wrong cast into a
 * clear, actionable error at the point of use.
 *
 * @example
 * ```ts
 * const { dateType } = getOasAdapter(ctx.adapter).options
 * ```
 */
export function getOasAdapter(adapter: Adapter): Adapter<AdapterOas> {
  if (adapter.name !== 'oas') {
    throw new Diagnostics.Error({
      code: Diagnostics.code.adapterRequired,
      severity: 'error',
      message: `Expected the OpenAPI adapter (adapterOas), but received "${adapter.name}".`,
      help: 'Set `adapter: adapterOas()` in kubb.config.ts.',
      location: { kind: 'config' },
    })
  }

  return adapter as Adapter<AdapterOas>
}
