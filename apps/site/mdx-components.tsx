import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { isValidElement } from 'react'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { MermaidDiagram } from './components/mermaid-diagram'

type PreProps = ComponentPropsWithoutRef<'pre'> & {
  'icon'?: string
  'data-iconcat-code-kind'?: string
}

interface TextCodeBlockProps {
  code: string
}

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join('')
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children)
  }

  return ''
}

function TextCodeBlock({ code }: TextCodeBlockProps) {
  return (
    <CodeBlock
      className='iconcat-text-codeblock'
      viewportProps={{ className: 'iconcat-text-codeblock-viewport' }}
    >
      <Pre className='iconcat-text-codeblock-pre'>
        <code>
          {code.split('\n').map((line, index) => (
            <span className='line' key={index}>
              <span>{line}</span>
            </span>
          ))}
        </code>
      </Pre>
    </CodeBlock>
  )
}

export const mdxComponents = {
  ...defaultMdxComponents,
  pre(props: PreProps) {
    const child = props.children

    if (props['data-iconcat-code-kind'] === 'text') {
      return <TextCodeBlock code={getTextContent(child)} />
    }

    if (
      child
      && typeof child === 'object'
      && 'type' in child
      && child.type === 'code'
    ) {
      const chart = getTextContent(child)

      if (/^\s*(?:flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph)\b/.test(chart)) {
        return <MermaidDiagram chart={chart.trim()} />
      }
    }

    return defaultMdxComponents.pre(props)
  },
}
