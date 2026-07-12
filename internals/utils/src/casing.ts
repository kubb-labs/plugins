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

/**
 * Shared implementation for camelCase and PascalCase conversion.
 * Splits on common word boundaries (spaces, hyphens, underscores, dots, slashes, colons)
 * and capitalizes each word according to `pascal`.
 *
 * When `pascal` is `true` the first word is also capitalized (PascalCase), otherwise only subsequent words are.
 */
function toCamelOrPascal(text: string, pascal: boolean): string {
  return text
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .split(/[\s\-_./\\:]+/)
    .filter(Boolean)
    .map((word, i) => {
      if (word.length > 1 && word === word.toUpperCase()) return word
      const head = i === 0 && !pascal ? word.charAt(0).toLowerCase() : word.charAt(0).toUpperCase()
      return head + word.slice(1)
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')
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
  const processed = `${prefix} ${text} ${suffix}`.trim()
  return processed
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-.]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
    .split('_')
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
