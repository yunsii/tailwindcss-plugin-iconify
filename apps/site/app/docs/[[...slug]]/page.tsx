import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page'
import { notFound } from 'next/navigation'

import { mdxComponents } from '../../../mdx-components'
import { source } from '../../../source'

export default async function Page({ params }: PageProps<'/docs/[[...slug]]'>) {
  const resolvedParams = await params
  const page = source.getPage(resolvedParams.slug)

  if (!page) {
    notFound()
  }

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={mdxComponents} />
      </DocsBody>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams('slug')
}

export async function generateMetadata({ params }: PageProps<'/docs/[[...slug]]'>) {
  const resolvedParams = await params
  const page = source.getPage(resolvedParams.slug)

  if (!page) {
    notFound()
  }

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
