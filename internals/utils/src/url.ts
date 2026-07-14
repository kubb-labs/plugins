import { camelCase } from './casing.ts'
import { isValidVarName } from './reserved.ts'

export type URLObject = {
  /**
   * The resolved URL string (Express-style or template literal, depending on context).
   */
  url: string
  /**
   * Extracted path parameters as a key-value map, or `null` when the path has none.
   */
  params: Record<string, string> | null
}

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

type ObjectOptions = {
  /**
   * Controls whether the `url` is rendered as an Express path or a template literal.
   * @default 'path'
   */
  type?: 'path' | 'template'
  /**
   * Transform applied to each extracted parameter name.
   */
  replacer?: (pathParam: string) => string
  /**
   * When `true`, the result is serialized to a string expression instead of a plain object.
   */
  stringify?: boolean
}

/**
 * Keeps the OpenAPI parameter name as-is when it is already a valid JS identifier, and
 * camelCases it only enough to become one otherwise (for example a hyphenated path segment).
 */
function transformParam(raw: string): string {
  return isValidVarName(raw) ? raw : camelCase(raw)
}

function toParamsObject(path: string, { replacer }: { replacer?: (pathParam: string) => string } = {}): Record<string, string> | null {
  const params: Record<string, string> = {}

  for (const match of path.matchAll(/\{([^}]+)\}/g)) {
    const param = transformParam(match[1]!)
    const key = replacer ? replacer(param) : param
    params[key] = key
  }

  return Object.keys(params).length > 0 ? params : null
}

/**
 * Helpers for OpenAPI/Swagger paths, plus a thin wrapper over the native `URL`.
 */
export class Url {
  /**
   * Reports whether `url` is a parseable absolute URL. Delegates to the native `URL.canParse`.
   *
   * @example
   * Url.canParse('https://petstore.swagger.io/v2') // true
   * Url.canParse('/pet/{petId}')                   // false
   */
  static canParse(url: string, base?: string | URL): boolean {
    return URL.canParse(url, base)
  }

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
   * `names`, given in path-parameter order, overrides each placeholder's own text with the
   * declared parameter name. A spec's path template and its parameter objects are expected to
   * agree, but when they don't, the generated `path` type follows the declared name, so the
   * interpolation must too.
   *
   * @example
   * Url.toGroupedTemplateString('/pet/{petId}') // '`/pet/${path.petId}`'
   */
  static toGroupedTemplateString(path: string, { prefix, names }: { prefix?: string | null; names?: ReadonlyArray<string> } = {}): string {
    let index = 0
    return Url.toTemplateString(path, { prefix, replacer: (name) => `path.${names?.[index++] ?? name}` })
  }

  /**
   * Returns the path and its extracted params as a structured `URLObject`, or as a stringified
   * expression when `stringify` is set.
   *
   * @example
   * Url.toObject('/pet/{petId}')
   * // { url: '/pet/:petId', params: { petId: 'petId' } }
   */
  static toObject(path: string, { type = 'path', replacer, stringify }: ObjectOptions = {}): URLObject | string {
    const object: URLObject = {
      url: type === 'path' ? Url.toPath(path) : Url.toTemplateString(path, { replacer }),
      params: toParamsObject(path, { replacer }),
    }

    if (stringify) {
      if (type === 'template') {
        return JSON.stringify(object).replaceAll("'", '').replaceAll(`"`, '')
      }

      if (object.params) {
        return `{ url: '${object.url}', params: ${JSON.stringify(object.params).replaceAll("'", '').replaceAll(`"`, '')} }`
      }

      return `{ url: '${object.url}' }`
    }

    return object
  }
}
