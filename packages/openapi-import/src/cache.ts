import type { Options } from './options.ts'
import type { TransformParams } from './transform.ts'

/**
 * Wraps a transform so a repeated request for the same file, content and options returns the
 * previous result. TypeScript asks again for specs it already transformed (another project, a
 * reload), and a Kubb build of a large spec takes seconds. A failed transform is not kept.
 */
export function cacheTransform<TResult>(
  transform: (params: TransformParams, options?: Options) => Promise<TResult>,
): (params: TransformParams, options?: Options) => Promise<TResult> {
  const results = new Map<string, { content: string; arrayType: Options['arrayType']; result: Promise<TResult> }>()

  return (params, options = {}) => {
    const cached = results.get(params.fileName)
    if (cached && cached.content === params.content && cached.arrayType === options.arrayType) return cached.result

    const result = transform(params, options)
    results.set(params.fileName, { content: params.content, arrayType: options.arrayType, result })
    result.catch(() => results.delete(params.fileName))
    return result
  }
}
