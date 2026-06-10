import { camelCase } from '@internals/utils'
import { trimQuotes } from '@kubb/ast/utils'
import type { ast } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { File } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'
import { ENUM_TYPES_WITH_KEY_SUFFIX, ENUM_TYPES_WITH_RUNTIME_VALUE, ENUM_TYPES_WITH_TYPE_ONLY } from '../constants.ts'
import * as factory from '../factory.ts'
import type { PluginTs, ResolverTs } from '../types.ts'

type Props = {
  node: ast.EnumSchemaNode
  enumType: PluginTs['resolvedOptions']['enum']['type']
  enumConstCasing: PluginTs['resolvedOptions']['enum']['constCasing']
  enumTypeSuffix: PluginTs['resolvedOptions']['enum']['typeSuffix']
  enumKeyCasing: PluginTs['resolvedOptions']['enum']['keyCasing']
  resolver: ResolverTs
  key?: string | number | null
}

/**
 * Resolves the runtime identifier name and the TypeScript type name for an enum schema node.
 *
 * The raw `node.name` may be a YAML key such as `"enumNames.Type"` which is not a
 * valid TypeScript identifier. The resolver normalizes it; for inline enum
 * properties the adapter already emits a PascalCase+suffix name so resolution is typically a no-op.
 *
 * When `enumConstCasing` is `'pascalCase'` and `enumTypeSuffix` is empty the const and the type
 * resolve to the same name, which TypeScript merges into a single value+type declaration.
 */
export function getEnumNames({
  node,
  enumType,
  enumConstCasing,
  enumTypeSuffix,
  resolver,
}: {
  node: ast.EnumSchemaNode
  enumType: PluginTs['resolvedOptions']['enum']['type']
  enumConstCasing: PluginTs['resolvedOptions']['enum']['constCasing']
  enumTypeSuffix: PluginTs['resolvedOptions']['enum']['typeSuffix']
  resolver: ResolverTs
}): {
  enumName: string
  typeName: string
} {
  const resolved = resolver.default(node.name!, 'type')
  const enumName = enumConstCasing === 'pascalCase' ? resolved : camelCase(node.name!)
  const typeName = ENUM_TYPES_WITH_KEY_SUFFIX.has(enumType) ? resolver.resolveEnumKeyName(node, enumTypeSuffix) : resolved

  return { enumName, typeName }
}

/**
 * Renders the enum declaration(s) for a single named `EnumSchemaNode`.
 *
 * Depending on `enumType` this may emit:
 * - A runtime object (`asConst` / `asPascalConst`) plus a `typeof` type alias
 * - A `const enum` or plain `enum` declaration (`constEnum` / `enum`)
 * - A union literal type alias (`literal`)
 *
 * The emitted `File.Source` nodes carry the resolved names so that the barrel
 * index picks up the correct export identifiers.
 */
export function Enum({ node, enumType, enumConstCasing, enumTypeSuffix, enumKeyCasing, resolver }: Props): KubbReactNode {
  const { enumName, typeName } = getEnumNames({ node, enumType, enumConstCasing, enumTypeSuffix, resolver })

  const [nameNode, typeNode] = factory.createEnumDeclaration({
    name: enumName,
    typeName,
    enums: (node.namedEnumValues?.map((v) => [trimQuotes(v.name.toString()), v.value]) ??
      node.enumValues?.filter((v): v is NonNullable<typeof v> => v !== null && v !== undefined).map((v) => [trimQuotes(v.toString()), v]) ??
      []) as Array<[string | number, string | number | boolean]>,
    type: enumType,
    enumKeyCasing,
  })

  // When the const and the type share a name (pascalCase const + empty typeSuffix) they merge into
  // one declaration. The const carries the barrel export; keep the type alias in the file but out of
  // the barrel so it is not re-exported a second time as `export type { … }`.
  const namesMerge = !!nameNode && enumName === typeName

  return (
    <>
      {nameNode && (
        <File.Source name={enumName} isExportable isIndexable isTypeOnly={false}>
          {parserTs.print(nameNode)}
        </File.Source>
      )}
      <File.Source
        name={typeName}
        isIndexable={!namesMerge}
        isExportable={!namesMerge && ENUM_TYPES_WITH_RUNTIME_VALUE.has(enumType)}
        isTypeOnly={ENUM_TYPES_WITH_TYPE_ONLY.has(enumType)}
      >
        {parserTs.print(typeNode)}
      </File.Source>
    </>
  )
}
