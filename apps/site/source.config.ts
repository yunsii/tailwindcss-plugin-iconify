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

export const docs = defineDocs({
  dir: '../../docs',
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: (value) => [
      ...value,
      remarkTextCodeBlocks,
    ],
  },
})
