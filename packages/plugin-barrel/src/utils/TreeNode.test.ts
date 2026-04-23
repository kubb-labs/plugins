import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { TreeNode } from './TreeNode.ts'

describe('TreeNode', () => {
  const files: ast.FileNode[] = [
    ast.createFile({
      path: 'src/test.ts',
      baseName: 'test.ts',
      sources: [],
      meta: {},
      imports: [],
      exports: [],
    }),
    ast.createFile({
      path: 'src/sub/hello.ts',
      baseName: 'hello.ts',
      sources: [],
      meta: {},
      imports: [],
      exports: [],
    }),
    ast.createFile({
      path: 'src/sub/world.ts',
      baseName: 'world.ts',
      sources: [],
      meta: {},
      imports: [],
      exports: [],
    }),
  ]
  const tree = TreeNode.build(files, 'src/')
  const treeWindows = TreeNode.build(files, 'src\\')

  test('if schemas folder contains x files and y folders', () => {
    expect(tree).toBeDefined()
    expect(treeWindows).toBeDefined()

    expect(tree).toMatchInlineSnapshot(`
      TreeNode {
        "children": [
          TreeNode {
            "children": [],
            "data": {
              "file": {
                "baseName": "test.ts",
                "exports": [],
                "extname": ".ts",
                "id": "81188fa6e8155e286766a6f3ca74e3eaf1e65e4aca7c0c2788e588b32c591288",
                "imports": [],
                "kind": "File",
                "meta": {},
                "name": "test",
                "path": "src/test.ts",
                "sources": [],
              },
              "name": "test.ts",
              "path": "src/test.ts",
              "type": "single",
            },
            "parent": [Circular],
          },
          TreeNode {
            "children": [
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "hello.ts",
                    "exports": [],
                    "extname": ".ts",
                    "id": "9e2eb758d04ed285d5eb44154f8ce82fafc1a45f3454ec50e776a6ad2923bdbc",
                    "imports": [],
                    "kind": "File",
                    "meta": {},
                    "name": "hello",
                    "path": "src/sub/hello.ts",
                    "sources": [],
                  },
                  "name": "hello.ts",
                  "path": "src/sub/hello.ts",
                  "type": "single",
                },
                "parent": [Circular],
              },
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "world.ts",
                    "exports": [],
                    "extname": ".ts",
                    "id": "8875e1f9f216417bf0cd05cf4a1a49f430094b0700574b1db6e4e2406feeb850",
                    "imports": [],
                    "kind": "File",
                    "meta": {},
                    "name": "world",
                    "path": "src/sub/world.ts",
                    "sources": [],
                  },
                  "name": "world.ts",
                  "path": "src/sub/world.ts",
                  "type": "single",
                },
                "parent": [Circular],
              },
            ],
            "data": {
              "file": undefined,
              "name": "sub",
              "path": "src/sub",
              "type": "split",
            },
            "parent": [Circular],
          },
        ],
        "data": {
          "file": undefined,
          "name": "src/",
          "path": "src/",
          "type": "split",
        },
        "parent": undefined,
      }
    `)
    expect(tree).toMatchInlineSnapshot(`
      TreeNode {
        "children": [
          TreeNode {
            "children": [],
            "data": {
              "file": {
                "baseName": "test.ts",
                "exports": [],
                "extname": ".ts",
                "id": "81188fa6e8155e286766a6f3ca74e3eaf1e65e4aca7c0c2788e588b32c591288",
                "imports": [],
                "kind": "File",
                "meta": {},
                "name": "test",
                "path": "src/test.ts",
                "sources": [],
              },
              "name": "test.ts",
              "path": "src/test.ts",
              "type": "single",
            },
            "parent": [Circular],
          },
          TreeNode {
            "children": [
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "hello.ts",
                    "exports": [],
                    "extname": ".ts",
                    "id": "9e2eb758d04ed285d5eb44154f8ce82fafc1a45f3454ec50e776a6ad2923bdbc",
                    "imports": [],
                    "kind": "File",
                    "meta": {},
                    "name": "hello",
                    "path": "src/sub/hello.ts",
                    "sources": [],
                  },
                  "name": "hello.ts",
                  "path": "src/sub/hello.ts",
                  "type": "single",
                },
                "parent": [Circular],
              },
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "world.ts",
                    "exports": [],
                    "extname": ".ts",
                    "id": "8875e1f9f216417bf0cd05cf4a1a49f430094b0700574b1db6e4e2406feeb850",
                    "imports": [],
                    "kind": "File",
                    "meta": {},
                    "name": "world",
                    "path": "src/sub/world.ts",
                    "sources": [],
                  },
                  "name": "world.ts",
                  "path": "src/sub/world.ts",
                  "type": "single",
                },
                "parent": [Circular],
              },
            ],
            "data": {
              "file": undefined,
              "name": "sub",
              "path": "src/sub",
              "type": "split",
            },
            "parent": [Circular],
          },
        ],
        "data": {
          "file": undefined,
          "name": "src/",
          "path": "src/",
          "type": "split",
        },
        "parent": undefined,
      }
    `)
  })
})
