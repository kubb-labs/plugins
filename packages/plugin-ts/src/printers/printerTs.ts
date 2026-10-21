import { mapSchemaItems, mapSchemaProperties } from '@internals/shared'
import { ast, isStringType, syncSchemaRef } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import type ts from '@typescript/typescript6'
import * as factory from '../factory.ts'
import type { PluginTs, ResolverTs } from '../types.ts'
import { buildPropertyJSDocComments, enumTypeName, isInlineConstEnum } from '../utils.ts'

const { isNonNullable } = factory

/**
 * Partial map of node-type overrides for the TypeScript printer.
 *
 * Each key is a `SchemaType` string (e.g. `'date'`, `'string'`). The function
 * replaces the built-in handler for that node type. Use `this.transform` to
 * recurse into nested schema nodes, and `this.options` to read printer options.
 *
 * @example Override the `date` handler
 * ```ts
 * pluginTs({
 *   printer: {
 *     nodes: {
 *       date(node) {
 *         return ts.factory.createTypeReferenceNode('Date', [])
 *       },
 *     },
 *   },
 * })
 * ```
 */
export type PrinterTsNodes = ast.PrinterPartial<ts.TypeNode, PrinterTsOptions>

export type PrinterTsOptions = {
  /**
   * Mark parameters as optional with `?` or `| undefined`.
   * - `'questionToken'` adds `?` to properties
   * - `'undefined'` adds `| undefined` to types
   *
   * @default `'questionToken'`
   */
  optionalType: PluginTs['resolvedOptions']['optionalType']
  /**
   * Array representation style.
   * - `'array'` uses bracket notation (`T[]`)
   * - `'generic'` uses generic syntax (`Array<T>`)
   *
   * @default `'array'`
   */
  arrayType: PluginTs['resolvedOptions']['arrayType']
  /**
   * Grouped enum settings. The printer emits references to enums, not the enum declarations, so only
   * `type` (the output format) and `typeSuffix` (the enum key reference suffix) matter here.
   * `constCasing` and `keyCasing` are ignored.
   */
  enum: PluginTs['resolvedOptions']['enum']
  /**
   * Syntax for generated declarations.
   * - `'type'` generates type aliases
   * - `'interface'` generates interface declarations
   *
   * @default `'type'`
   */
  syntaxType?: PluginTs['resolvedOptions']['syntaxType']
  /**
   * Exported name for the type declaration.
   * When omitted, returns only the raw type node.
   */
  name?: string

  /**
   * JSDoc comment to attach to the generated type.
   */
  description?: string
  /**
   * Properties to exclude using `Omit<Type, Keys>`.
   * Forces type alias syntax regardless of `syntaxType` setting.
   */
  keysToOmit?: Array<string> | null
  /**
   * Transforms raw schema names into valid TypeScript identifiers.
   */
  resolver: ResolverTs
  /**
   * Schema names that represent enums for suffixed key references.
   */
  enumSchemaNames?: Set<string>
  /**
   * Custom handler map for node type overrides.
   */
  nodes?: PrinterTsNodes
}

/**
 * TypeScript printer factory options: maps `SchemaNode` → `ts.TypeNode` (raw) or `ts.Node` (full declaration).
 */
export type PrinterTsFactory = ast.PrinterFactoryOptions<'typescript', PrinterTsOptions, ts.TypeNode, string>

type PrinterTs = PrinterTsFactory

/**
 * TypeScript type printer built with `definePrinter`.
 *
 * Converts a `SchemaNode` AST node into a TypeScript AST node:
 * - **`printer.print(node)`** — when `options.typeName` is set, returns a full
 *   `type Name = …` or `interface Name { … }` declaration (`ts.Node`).
 *   Without `typeName`, returns the raw `ts.TypeNode` for the schema.
 *
 * Dispatches on `node.type` to the appropriate handler in `nodes`. Options are closed
 * over per printer instance, so each call to `printerTs(options)` produces an independent printer.
 *
 * @example Raw type node (no `typeName`)
 * ```ts
 * const printer = printerTs({ optionalType: 'questionToken', arrayType: 'array', enum: { type: 'inlineLiteral' } })
 * const typeNode = printer.print(schemaNode) // ts.TypeNode
 * ```
 *
 * @example Full declaration (with `typeName`)
 * ```ts
 * const printer = printerTs({ optionalType: 'questionToken', arrayType: 'array', enum: { type: 'inlineLiteral' }, typeName: 'MyType' })
 * const declaration = printer.print(schemaNode) // ts.TypeAliasDeclaration | ts.InterfaceDeclaration
 * ```
 */
export const printerTs = ast.createPrinter<PrinterTs>((options) => {
  const addsUndefined = options.optionalType === 'undefined' || options.optionalType === 'questionTokenAndUndefined'

  return {
    name: 'typescript',
    options,
    nodes: {
      any: () => factory.keywordTypeNodes.any,
      unknown: () => factory.keywordTypeNodes.unknown,
      void: () => factory.keywordTypeNodes.void,
      never: () => factory.keywordTypeNodes.never,
      boolean: () => factory.keywordTypeNodes.boolean,
      null: () => factory.keywordTypeNodes.null,
      blob: () => factory.createTypeReferenceNode('Blob', []),
      string: () => factory.keywordTypeNodes.string,
      uuid: () => factory.keywordTypeNodes.string,
      email: () => factory.keywordTypeNodes.string,
      url: (node) => {
        if (node.path) {
          return factory.createUrlTemplateType(node.path)
        }
        return factory.keywordTypeNodes.string
      },
      ipv4: () => factory.keywordTypeNodes.string,
      ipv6: () => factory.keywordTypeNodes.string,
      datetime: () => factory.keywordTypeNodes.string,
      number: () => factory.keywordTypeNodes.number,
      integer: () => factory.keywordTypeNodes.number,
      bigint: () => factory.keywordTypeNodes.bigint,
      date: factory.dateOrStringNode,
      time: factory.dateOrStringNode,
      ref(node) {
        if (!node.name) {
          return null
        }
        // `node.name` may have been overridden (e.g. by the single-member allOf flatten using the
        // property-derived child name), so resolve the target through `resolveRefName` instead.
        const refName = ast.resolveRefName(node)
        if (!refName) {
          return null
        }

        // When a Key suffix is configured, enum refs must use the suffixed name (e.g. `StatusKey`)
        // so the reference matches what the enum file actually exports.
        const name = node.ref
          ? enumTypeName({
              resolver: this.options.resolver,
              name: refName,
              enumOptions: this.options.enum,
              isEnum: !!this.options.enumSchemaNames?.has(refName),
            })
          : refName

        return factory.createTypeReferenceNode(name, undefined)
      },
      enum(node) {
        const values = ast.getSchemaLiteralValues(node)

        // A `const` (single-value enum) the adapter did not register as a named enum emits the bare
        // literal regardless of `enum.type`, matching how its references resolve.
        if (this.options.enum.type === 'inlineLiteral' || !node.name || isInlineConstEnum(node, this.options.enumSchemaNames)) {
          const literalNodes = values
            .filter((v): v is string | number | boolean => v !== null && v !== undefined)
            .map((value) => factory.constToTypeNode(value, typeof value as 'string' | 'number' | 'boolean'))
            .filter(isNonNullable)

          return factory.createUnionDeclaration({ withParentheses: true, nodes: literalNodes })
        }

        const resolvedName = enumTypeName({ resolver: this.options.resolver, name: node.name, enumOptions: this.options.enum, isEnum: true })

        return factory.createTypeReferenceNode(resolvedName, undefined)
      },
      union(node) {
        const members = node.members ?? []

        const hasStringLiteral = members.some((m) => {
          const enumNode = ast.narrowSchema(m, ast.schemaTypes.enum)
          return enumNode?.primitive === 'string'
        })
        const hasPlainString = members.some((m) => isStringType(m))

        if (hasStringLiteral && hasPlainString) {
          const memberNodes = members
            .map((m) => {
              if (isStringType(m)) {
                return factory.createIntersectionDeclaration({
                  nodes: [factory.keywordTypeNodes.string, factory.createTypeLiteralNode([])],
                  withParentheses: true,
                })
              }

              return this.transform(m)
            })
            .filter(isNonNullable)

          return factory.createUnionDeclaration({ withParentheses: true, nodes: memberNodes })
        }

        return factory.createUnionDeclaration({ withParentheses: true, nodes: factory.buildMemberNodes(members, this.transform) })
      },
      intersection(node) {
        return factory.createIntersectionDeclaration({ withParentheses: true, nodes: factory.buildMemberNodes(node.members, this.transform) })
      },
      array(node) {
        const itemNodes = mapSchemaItems(node, (item) => this.transform(item))
          .map(({ output }) => output)
          .filter(isNonNullable)

        return factory.createArrayDeclaration({ nodes: itemNodes, arrayType: this.options.arrayType })
      },
      tuple(node) {
        return factory.buildTupleNode(node, this.transform)
      },
      object(node) {
        const { transform, options } = this

        const addsQuestionToken = options.optionalType === 'questionToken' || options.optionalType === 'questionTokenAndUndefined'

        const propertyNodes: Array<ts.TypeElement> = mapSchemaProperties(node, (schema) => transform(schema)).map(({ name, property, output }) => {
          const baseType = output ?? factory.keywordTypeNodes.unknown
          const optional = !property.required || !!property.schema.optional || !!property.schema.nullish
          const type = factory.buildPropertyType(property.schema, baseType, options.optionalType, optional)
          const propMeta = syncSchemaRef(property.schema)

          const propertyNode = factory.createPropertySignature({
            questionToken: optional ? addsQuestionToken : false,
            name,
            type,
            readOnly: propMeta?.readOnly,
          })

          return factory.appendJSDocToNode({ node: propertyNode, comments: buildPropertyJSDocComments(property.schema, optional) })
        })

        const allElements = [...propertyNodes, ...factory.buildIndexSignatures(node, propertyNodes.length, transform)]

        if (!allElements.length) {
          return factory.keywordTypeNodes.object
        }

        return factory.createTypeLiteralNode(allElements)
      },
      ...options.nodes,
    },
    print(node) {
      const { name, syntaxType = 'type', description, keysToOmit } = this.options

      const transformed = this.transform(node)
      if (!transformed) return null

      // For ref nodes, structural metadata lives on node.schema rather than the ref node itself.
      const meta = syncSchemaRef(node)

      // Without name, apply modifiers inline and return.
      if (!name) {
        const result = factory.wrapNullableOptional(transformed, !!meta.nullable, !!(meta.nullish || meta.optional) && addsUndefined)
        return parserTs().print(result)
      }

      // When keysToOmit is present, wrap with Omit first, then apply nullable/optional
      // modifiers so they are not swallowed by NonNullable inside createOmitDeclaration.
      const inner = (() => {
        const omitted: ts.TypeNode = keysToOmit?.length
          ? factory.createOmitDeclaration({ keys: keysToOmit, type: transformed, nonNullable: true })
          : transformed
        // For named type declarations (type aliases), optional/nullish always produces | undefined
        // regardless of optionalType — the questionToken ? modifier only applies to object properties.
        return factory.wrapNullableOptional(omitted, !!meta.nullable, !!(meta.nullish || meta.optional))
      })()

      const useTypeGeneration = syntaxType === 'type' || factory.isUnionTypeNode(inner) || !!keysToOmit?.length

      const typeNode = factory.createTypeDeclaration({
        name,
        isExportable: true,
        type: inner,
        syntax: useTypeGeneration ? 'type' : 'interface',
        comments: buildPropertyJSDocComments({
          ...meta,
          description,
        }),
      })

      return parserTs().print(typeNode)
    },
  }
})
