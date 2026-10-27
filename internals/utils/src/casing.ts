type Options = {
  /**
   * Text prepended before casing is applied.
   */
  prefix?: string
  /**
   * Text appended before casing is applied.
   */
  suffix?: string
}

// A word starts at `petType`, `sensor2Reading`, and `HTTPResponse`, while `IDs` and `OAuth` stay whole
const wordStart = /(?<=[a-z\d])(?=[A-Z])|(?<=[A-Z]{2})(?=[A-Z][a-z]{2})/

/**
 * Splits `text` into words on separators (whitespace, hyphens, underscores, dots, slashes, colons)
 * and on {@link wordStart}. A segment without lowercase letters, such as `COOL` or `2D`, is one word,
 * so snake case leaves a name that is already in it unchanged.
 */
function words(text: string): Array<string> {
  return text
    .split(/[\s\-_./\\:]+/)
    .filter(Boolean)
    .flatMap((segment) => (segment === segment.toUpperCase() ? segment : segment.split(wordStart)))
}

/**
 * Shared implementation for camelCase and PascalCase conversion.
 * Capitalizes each word from {@link words} according to `pascal`.
 *
 * When `pascal` is `true` the first word is also capitalized (PascalCase), otherwise only subsequent words are.
 */
function convert(text: string, pascal: boolean): string {
  // Also split after a digit (`v1alpha1` → `v1Alpha1`) and inside `URLs`, as camelCase always has. Snake
  // case keeps both whole, so `cool_2d_drawing` and `urls` stay unchanged
  return words(text)
    .flatMap((word) => word.split(/(?<=\d)(?=[a-z])|(?<=[A-Z])(?=[A-Z][a-z])/))
    .map((word, i) => {
      if (word.length > 1 && word === word.toUpperCase()) return word
      const head = i === 0 && !pascal ? word.charAt(0).toLowerCase() : word.charAt(0).toUpperCase()
      return head + word.slice(1)
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
}

// Plugins resolve the same names over and over (about 47,000 calls for a 1,000 schema spec), so
// results are kept. Clearing at the limit bounds the memory a long-running process spends on it.
const cache = new Map<string, string>()
const cacheLimit = 10_000

function toCamelOrPascal(text: string, pascal: boolean): string {
  const key = `${pascal ? 'P' : 'c'}${text}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const result = convert(text, pascal)
  if (cache.size >= cacheLimit) cache.clear()
  cache.set(key, result)
  return result
}

/**
 * Converts `text` to camelCase.
 *
 * @example Word boundaries
 * `camelCase('hello-world') // 'helloWorld'`
 *
 * @example With a prefix
 * `camelCase('tag', { prefix: 'create' }) // 'createTag'`
 */
export function camelCase(text: string, { prefix = '', suffix = '' }: Options = {}): string {
  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, false)
}

/**
 * Converts `text` to PascalCase.
 *
 * @example Word boundaries
 * `pascalCase('hello-world') // 'HelloWorld'`
 *
 * @example With a suffix
 * `pascalCase('tag', { suffix: 'schema' }) // 'TagSchema'`
 */
export function pascalCase(text: string, { prefix = '', suffix = '' }: Options = {}): string {
  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, true)
}

/**
 * Uppercases only the first character of `text`, leaving the rest untouched.
 * Unlike {@link pascalCase} it never re-splits word boundaries or strips characters.
 *
 * @example
 * `capitalize('getPetById') // 'GetPetById'`
 */
export function capitalize(text: string): string {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
}

/**
 * Converts `text` to snake_case.
 *
 * @example From camelCase
 * `snakeCase('helloWorld') // 'hello_world'`
 *
 * @example From mixed separators
 * `snakeCase('Hello-World') // 'hello_world'`
 */
export function snakeCase(text: string, { prefix = '', suffix = '' }: Options = {}): string {
  return words(`${prefix} ${text} ${suffix}`)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
    .filter(Boolean)
    .join('_')
}

/**
 * Converts `text` to SCREAMING_SNAKE_CASE.
 *
 * @example From camelCase
 * `screamingSnakeCase('helloWorld') // 'HELLO_WORLD'`
 */
export function screamingSnakeCase(text: string, { prefix = '', suffix = '' }: Options = {}): string {
  return snakeCase(text, { prefix, suffix }).toUpperCase()
}
