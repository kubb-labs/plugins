import { camelCase } from './casing.ts'
import { isValidVarName } from './reserved.ts'

type TemplateOptions = {
  /**
   * Literal text prepended inside the template literal, e.g. a base URL.
   */
  prefix?: string | null
  /**
   * Transform applied to each extracted parameter name before interpolation.
   */
  replacer?: (pathParam: string) => string
}

/**
 * Keeps the OpenAPI parameter name as-is when it is already a valid JS identifier, and
 * camelCases it only enough to become one otherwise (for example a hyphenated path segment).
 */
function transformParam(raw: string): string {
  return isValidVarName(raw) ? raw : camelCase(raw)
}

/**
 * Helpers for OpenAPI/Swagger paths.
 */
export class Url {
  /**
   * Converts an OpenAPI/Swagger path to Express-style colon syntax.
   *
   * @example
   * Url.toPath('/pet/{petId}') // '/pet/:petId'
   */
  static toPath(path: string): string {
    return path.replace(/\{([^}]+)\}/g, ':$1')
  }

  /**
   * Rewrites OpenAPI placeholder names while keeping the `{...}` braces, so the generated `url`
   * literal aligns with the grouped `path` request option that the runtime client interpolates by
   * key.
   *
   * @example
   * Url.toSafeTemplate('/user/{monetary-account-id}') // '/user/{monetaryAccountId}'
   */
  static toSafeTemplate(path: string): string {
    return path.replace(/\{([^}]+)\}/g, (_, name: string) => `{${transformParam(name)}}`)
  }

  /**
   * Converts an OpenAPI/Swagger path to a TypeScript template literal string.
   * `prefix` is prepended inside the literal, and `replacer` transforms each parameter name.
   *
   * @example
   * Url.toTemplateString('/pet/{petId}') // '`/pet/${petId}`'
   *
   * @example
   * Url.toTemplateString('/pet/{petId}', { prefix: 'https://api' }) // '`https://api/pet/${petId}`'
   */
  static toTemplateString(path: string, { prefix, replacer }: TemplateOptions = {}): string {
    const parts = path.split(/\{([^}]+)\}/)
    const result = parts
      .map((part, i) => {
        if (i % 2 === 0) return part
        const param = transformParam(part)
        return `\${${replacer ? replacer(param) : param}}`
      })
      .join('')

    return `\`${prefix ?? ''}${result}\``
  }

  /**
   * Converts an OpenAPI/Swagger path to a template literal that reads each parameter off the
   * grouped `path` request option, e.g. `/pet/{petId}` becomes `` `/pet/${path.petId}` ``. Parameter
   * names match the generated `path` type, and `prefix` is prepended inside the literal. Shared by
   * the client and cypress generators that pass a grouped `path` object.
   *
   * @example
   * Url.toGroupedTemplateString('/pet/{petId}') // '`/pet/${path.petId}`'
   */
  static toGroupedTemplateString(path: string, { prefix }: { prefix?: string | null } = {}): string {
    return Url.toTemplateString(path, { prefix, replacer: (name) => `path.${name}` })
  }
}
