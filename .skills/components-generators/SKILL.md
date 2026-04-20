---
name: components-generators
description: Guidance for writing `@kubb/renderer-jsx` components and generators (React-based and function-based).
---

# Components & Generators Skill

This skill helps agents answer questions about authoring components and generators using `@kubb/renderer-jsx`.

## When to Use

- When asked where to place components/generators
- When guiding authors to write React-based generators

## What It Does

- Lists common `renderer-jsx` components and where to place them
- Explains generator types and recommended patterns
- Provides a small conceptual example for authors

## Conceptual Example

```tsx
import { File, Function } from '@kubb/renderer-jsx'
export function Query({ name }: Props): FabricReactNode {
  return (
    <File.Source name={name} isExportable isIndexable>
      <Function name={name} export>
        // Generated code
      </Function>
    </File.Source>
  )
}
```

## Tips for Agents

- Recommend small, composable components
- Encourage use of `usePluginDriver()`, `useOas()`, `useOperationManager()` in components
- Recommend deterministic output to avoid noisy diffs

## Related Skills

| Skill                                                      | Use For                                       |
|------------------------------------------------------------|-----------------------------------------------|
| **[../plugin-architecture/SKILL.md](../plugin-architecture/SKILL.md)** | For lifecycle and plugin registration details |
