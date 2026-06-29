import { defineConfig, defineDocs } from 'fumadocs-mdx/config'

interface MarkdownNode {
  type: string
  lang?: string
  meta?: string | null
  name?: string
  value?: string
  children?: MarkdownNode[]
  attributes?: Array<{
    type: string
    name: string
    value: string
  }>
  [key: string]: unknown
}

function remarkTextCodeBlocks() {
  return (tree: MarkdownNode) => {
    transformTextCodeBlocks(tree)
  }
}

function remarkSoftLineBreaks() {
  return (tree: MarkdownNode) => {
    transformSoftLineBreaks(tree)
  }
}

function transformTextCodeBlocks(node: MarkdownNode) {
  if (!node.children) {
    return
  }

  node.children = node.children.map((child) => {
    if (child.type === 'code' && child.lang === 'text') {
      return {
        type: 'mdxJsxFlowElement',
        name: 'pre',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'data-iconcat-code-kind',
            value: 'text',
          },
        ],
        children: [
          {
            type: 'mdxJsxTextElement',
            name: 'code',
            attributes: [],
            children: [
              {
                type: 'text',
                value: child.value ?? '',
              },
            ],
          },
        ],
      }
    }

    transformTextCodeBlocks(child)
    return child
  })
}

function visitMarkdownNodes(node: MarkdownNode, visitor: (node: MarkdownNode) => void) {
  visitor(node)

  for (const child of node.children ?? []) {
    visitMarkdownNodes(child, visitor)
  }
}

function transformSoftLineBreaks(node: MarkdownNode) {
  if (!node.children) {
    return
  }

  const children: MarkdownNode[] = []

  for (const child of node.children) {
    if (child.type === 'text' && child.value?.includes('\n')) {
      const lines = child.value.split('\n')

      for (let index = 0; index < lines.length; index++) {
        const value = lines[index]

        if (value) {
          children.push({
            ...child,
            value,
          })
        }

        if (index < lines.length - 1) {
          children.push({ type: 'break' })
        }
      }

      continue
    }

    transformSoftLineBreaks(child)
    children.push(child)
  }

  node.children = children
}

export const docs = defineDocs({
  dir: '../../docs',
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: (value) => [
      ...value,
      remarkTextCodeBlocks,
      remarkSoftLineBreaks,
    ],
  },
})
