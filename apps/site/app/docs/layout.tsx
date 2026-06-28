import { DocsLayout } from 'fumadocs-ui/layouts/docs'

import type { ReactNode } from 'react'

import { source } from '../../source'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: 'Iconcat',
        url: '/',
      }}
      githubUrl='https://github.com/yunsii/tailwindcss-plugin-iconify'
    >
      {children}
    </DocsLayout>
  )
}
