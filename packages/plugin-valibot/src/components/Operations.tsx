import { stringifyObject } from '@internals/utils'
import type { ast } from '@kubb/core'
import { Const, File, Type } from '@kubb/renderer-jsx'
import type { KubbReactNode } from '@kubb/renderer-jsx/types'

type SchemaNames = {
  request: string | undefined
  parameters: {
    path: string | undefined
    query: string | undefined
    header: string | undefined
  }
  responses: { default?: string } & Record<number | string, string>
  errors: Record<number | string, string>
}

type Props = {
  name: string
  operations: Array<{ node: ast.OperationNode; data: SchemaNames }>
}

export function Operations({ name, operations }: Props): KubbReactNode {
  const operationsJSON = operations.reduce<Record<string, unknown>>(
    (prev, acc) => {
      prev[`"${acc.node.operationId}"`] = acc.data

      return prev
    },
    {} as Record<string, unknown>,
  )

  const pathsJSON = operations.reduce<Record<string, Record<string, string>>>((prev, acc) => {
    prev[`"${acc.node.path}"`] = {
      ...(prev[`"${acc.node.path}"`] ?? {}),
      [acc.node.method]: `operations["${acc.node.operationId}"]`,
    }

    return prev
  }, {})

  return (
    <>
      <File.Source name="OperationSchema" isExportable isIndexable>
        <Type name="OperationSchema" export>{`{
  readonly request: v.GenericSchema | undefined;
  readonly parameters: {
        readonly path: v.GenericSchema | undefined;
        readonly query: v.GenericSchema | undefined;
        readonly header: v.GenericSchema | undefined;
  };
  readonly responses: {
        readonly [status: number]: v.GenericSchema;
        readonly default?: v.GenericSchema;
  };
  readonly errors: {
        readonly [status: number]: v.GenericSchema;
  };
}`}</Type>
      </File.Source>
      <File.Source name="OperationsMap" isExportable isIndexable>
        <Type name="OperationsMap" export>
          {'Record<string, OperationSchema>'}
        </Type>
      </File.Source>
      <File.Source name={name} isExportable isIndexable>
        <Const export name={name} asConst>
          {`{${stringifyObject(operationsJSON)}}`}
        </Const>
      </File.Source>
      <File.Source name={'paths'} isExportable isIndexable>
        <Const export name={'paths'} asConst>
          {`{${stringifyObject(pathsJSON)}}`}
        </Const>
      </File.Source>
    </>
  )
}
