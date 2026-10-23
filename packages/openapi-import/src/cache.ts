import type { TransformParams, TransformSettings } from './transform.ts'

/**
 * Wraps a transform so a repeated request for the same file, content, options and config returns the
 * previous result. TypeScript asks again for specs it already transformed (another project, a
 * reload), and a Kubb build of a large spec takes seconds. A failed transform is not kept.
 */
export function cacheTransform<TResult>(
  transform: (params: TransformParams, settings?: TransformSettings) => Promise<TResult>,
): (params: TransformParams, settings?: TransformSettings) => Promise<TResult> {
  const results = new Map<string, { content: string; settings: TransformSettings; result: Promise<TResult> }>()

  return (params, settings = {}) => {
    const cached = results.get(params.fileName)
    // A reloaded config is a new object, so comparing by reference catches every config change.
    if (cached && cached.content === params.content && cached.settings.arrayType === settings.arrayType && cached.settings.config === settings.config) {
      return cached.result
    }

    const result = transform(params, settings)
    results.set(params.fileName, { content: params.content, settings, result })
    result.catch(() => results.delete(params.fileName))
    return result
  }
}
