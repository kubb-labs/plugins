// Re-export the core namespace as is: `export *` plus a self-namespace leaves `ast` empty in the bundled plugin `.d.ts`.
export { ast } from '@kubb/ast'
