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
 * Uppercases only the first character of `text`, leaving the rest untouched.
 * Unlike `pascalCase` it never re-splits word boundaries or strips characters.
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
