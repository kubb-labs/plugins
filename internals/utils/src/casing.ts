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

// shortcut: ASCII letters and digits only, as before; widen when non-ASCII names need casing
const isUpper = (char = '') => char >= 'A' && char <= 'Z'
const isLower = (char = '') => char >= 'a' && char <= 'z'
const isDigit = (char = '') => char >= '0' && char <= '9'
const isAlphanumeric = (char = '') => isUpper(char) || isLower(char) || isDigit(char)
const isSeparator = (char: string) => '-_./\\:'.includes(char) || char.trim() === ''

/**
 * Whether a new word starts at `index`: `petType`, `sensor2Reading`, `v2beta`, and `HTTPResponse` split,
 * while `IDs` and `OAuth` stay whole.
 */
function isWordStart(text: string, index: number): boolean {
  const prev = text[index - 1]
  const char = text[index]
  if (isUpper(char)) {
    return isLower(prev) || isDigit(prev) || (isUpper(prev) && isUpper(text[index - 2]) && isLower(text[index + 1]) && isLower(text[index + 2]))
  }
  return isDigit(prev) && isLower(char)
}

function splitSegment(segment: string): Array<string> {
  // A segment without lowercase letters, such as `COOL` or `2D`, is already one word
  if (![...segment].some(isLower)) return [segment]

  const parts: Array<string> = []
  let start = 0
  for (let index = 1; index < segment.length; index++) {
    if (!isWordStart(segment, index)) continue
    parts.push(segment.slice(start, index))
    start = index
  }
  parts.push(segment.slice(start))
  return parts
}

/**
 * Splits `text` into words on separators (whitespace, hyphens, underscores, dots, slashes, colons)
 * and on case boundaries. Every casing shares it, so converting to the casing a name is already in
 * changes nothing.
 */
function words(text: string): Array<string> {
  return [...text]
    .map((char) => (isSeparator(char) ? ' ' : char))
    .join('')
    .split(' ')
    .filter(Boolean)
    .flatMap(splitSegment)
}

function stripNonAlphanumeric(text: string): string {
  return [...text].filter(isAlphanumeric).join('')
}

/**
 * Shared implementation for camelCase and PascalCase conversion.
 * Capitalizes each word from {@link words} according to `pascal`.
 *
 * When `pascal` is `true` the first word is also capitalized (PascalCase), otherwise only subsequent words are.
 */
function convert(text: string, pascal: boolean): string {
  return stripNonAlphanumeric(
    words(text)
      .map((word, i) => {
        if (word.length > 1 && word === word.toUpperCase()) return word
        const head = i === 0 && !pascal ? word.charAt(0).toLowerCase() : word.charAt(0).toUpperCase()
        return head + word.slice(1)
      })
      .join(''),
  )
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
    .map((word) => stripNonAlphanumeric(word).toLowerCase())
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
