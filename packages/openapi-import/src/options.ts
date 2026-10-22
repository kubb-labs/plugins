/**
 * Options read from the mapper's `contentMappers[].options` entry in `tsconfig.json`.
 */
export type Options = {
  /**
   * Passed to `@kubb/plugin-ts`: `'array'` prints `T[]`, `'generic'` prints `Array<T>`.
   * @default 'array'
   */
  arrayType?: 'array' | 'generic'
}

/**
 * An invalid option, reported by TypeScript on the `options` object in `tsconfig.json`.
 */
export type OptionDiagnostic = {
  path: Array<string>
  messageText: string
}

const arrayTypes = ['array', 'generic']

/**
 * Validates the raw `options` value from `openProject`. Unknown keys and invalid values are
 * dropped and reported, so a typo shows up in `tsconfig.json` instead of being silently ignored.
 */
export function parseOptions(raw: unknown): { options: Options; diagnostics: Array<OptionDiagnostic> } {
  const options: Options = {}
  const diagnostics: Array<OptionDiagnostic> = []

  if (raw === undefined || raw === null) return { options, diagnostics }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { options, diagnostics: [{ path: [], messageText: 'Expected `options` to be an object.' }] }
  }

  for (const [key, value] of Object.entries(raw)) {
    if (key !== 'arrayType') {
      diagnostics.push({ path: [key], messageText: `Unknown option "${key}". Supported: arrayType.` })
      continue
    }
    if (typeof value !== 'string' || !arrayTypes.includes(value)) {
      diagnostics.push({ path: [key], messageText: `Expected "arrayType" to be one of ${arrayTypes.map((type) => `"${type}"`).join(', ')}.` })
      continue
    }
    options.arrayType = value as Options['arrayType']
  }

  return { options, diagnostics }
}
