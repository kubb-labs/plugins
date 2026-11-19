export * from '@kubb/ast'

// Plugin-only helpers go here as namespace overrides, e.g. `export * as http from './http.ts'`.
// An explicit export shadows the name that `export *` brings in, so call sites keep `ast.http.*`.
export * as ast from './index.ts'
