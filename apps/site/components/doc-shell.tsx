import Link from 'next/link'

import type { ReactNode } from 'react'

import { routerDemos } from '../lib/router-demos'

import type { RouterDemoKey } from '../lib/router-demos'

export function SiteNav() {
  return (
    <header className='nav'>
      <Link className='brand' href='/'>
        Iconcat
      </Link>
      <nav className='nav-links'>
        <Link href='/docs'>Docs</Link>
        <Link href='/docs/app'>App Router</Link>
        <Link href='/docs/pages'>Pages Router</Link>
        <Link href='/docs/react-router'>React Router</Link>
      </nav>
    </header>
  )
}

export function DocShell({
  active,
  children,
}: {
  active?: RouterDemoKey
  children: ReactNode
}) {
  return (
    <main className='shell'>
      <SiteNav />
      <div className='layout'>
        <aside className='sidebar'>
          <Link href='/docs'>Overview</Link>
          {Object.entries(routerDemos).map(([key, demo]) => (
            <Link
              key={key}
              data-active={active === key}
              href={demo.href}
            >
              {demo.title}
            </Link>
          ))}
        </aside>
        <article className='content'>{children}</article>
      </div>
    </main>
  )
}
