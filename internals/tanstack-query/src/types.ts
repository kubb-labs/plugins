import type { ast } from 'kubb/kit'

export type ParamsCasing = 'camelcase' | undefined
export type PathParamsType = 'object' | 'inline'
export type ParamsType = 'object' | 'inline'

export type Transformer = (props: { node: ast.OperationNode; casing: ParamsCasing }) => Array<unknown>
