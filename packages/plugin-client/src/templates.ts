import { fileURLToPath } from 'node:url'

// Resolved from a file directly in `src/`, so the same `../templates/` path works from `dist/`.
const templatePath = (name: string) => fileURLToPath(new URL(`../templates/${name}`, import.meta.url))

/**
 * Absolute paths of the shared runtime templates every client plugin copies into `.kubb/`.
 */
export const templates = {
  core: templatePath('core.ts'),
  mediaTypes: templatePath('mediaTypes.ts'),
  serializers: templatePath('serializers.ts'),
  standardSchema: templatePath('standardSchema.ts'),
  sse: templatePath('sse.ts'),
} as const
