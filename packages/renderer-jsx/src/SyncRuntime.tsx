/**
 * Synchronous recursive renderer — no React reconciler.
 *
 * Since all kubb components are pure functions (no hooks, no class components),
 * we can render the JSX element tree in a single recursive pass, building the
 * DOMElement tree directly without fiber, scheduler, or work loop overhead.
 *
 * Replaces the Runtime class for the jsxRenderer factory.
 */
import { Fragment } from 'react'
import type { FileNode } from '@kubb/ast'
import { appendChildNode, createNode, createTextNode, setAttribute } from './dom.ts'
import type { DOMElement, DOMNode, ElementNames, KubbReactElement, TextNode } from './types.ts'
import { processFiles } from './utils.ts'

type HostContext = {
  type: ElementNames
  isFile: boolean
  isSource: boolean
}

const ROOT_CONTEXT: HostContext = { type: 'kubb-root', isFile: false, isSource: false }

function childContext(parent: HostContext, type: ElementNames): HostContext {
  return {
    type,
    isFile: type === 'kubb-file' || parent.isFile,
    isSource: type === 'kubb-source' || parent.isSource,
  }
}

function walk(element: unknown, parentNode: DOMElement, ctx: HostContext): void {
  if (element === null || element === undefined || element === false || element === true) return

  if (typeof element === 'string' || typeof element === 'number') {
    if (ctx.isFile && !ctx.isSource) {
      throw new Error(`Text '${element}' must be inside a <File.Source> component when using <File/>`)
    }
    appendChildNode(parentNode as DOMNode, createTextNode(String(element)) as unknown as DOMNode)
    return
  }

  if (Array.isArray(element)) {
    for (const child of element) walk(child, parentNode, ctx)
    return
  }

  const el = element as { type: unknown; props: Record<string, unknown> }

  if (el.type === Fragment) {
    const children = el.props.children
    if (Array.isArray(children)) {
      for (const child of children) walk(child, parentNode, ctx)
    } else if (children !== undefined) {
      walk(children, parentNode, ctx)
    }
    return
  }

  if (typeof el.type === 'function') {
    let output: unknown
    try {
      output = (el.type as (p: Record<string, unknown>) => unknown)(el.props)
    } catch (err) {
      throw err
    }
    walk(output, parentNode, ctx)
    return
  }

  if (typeof el.type === 'string') {
    const node = createNode(el.type)
    for (const [key, value] of Object.entries(el.props)) {
      if (key === 'children' || value === undefined) continue
      setAttribute(node, key, value as string | boolean | object)
    }
    appendChildNode(parentNode as DOMNode, node as unknown as DOMNode)
    const newCtx = childContext(ctx, el.type as ElementNames)
    const children = el.props.children
    if (Array.isArray(children)) {
      for (const child of children) walk(child, node, newCtx)
    } else if (children !== undefined) {
      walk(children, node, newCtx)
    }
  }
}

export class SyncRuntime {
  readonly #rootNode: DOMElement
  nodes: FileNode[] = []

  constructor() {
    this.#rootNode = createNode('kubb-root')
  }

  render(element: KubbReactElement): void {
    walk(element, this.#rootNode, ROOT_CONTEXT)
    this.nodes.push(...processFiles(this.#rootNode))
    // reset for next render
    this.#rootNode.childNodes = []
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unmount(_error?: Error | number | null): void {}
}
