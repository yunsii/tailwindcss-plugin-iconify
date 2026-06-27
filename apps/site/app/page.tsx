import Link from 'next/link'

import { SiteNav } from '../components/doc-shell'

export default function HomePage() {
  return (
    <main className='shell'>
      <SiteNav />
      <section className='hero'>
        <h1>Entry-driven icon catalog extractor.</h1>
        <p>
          Iconcat follows your application entry graph, extracts reachable icon
          usage, and feeds focused catalogs into Tailwind, UnoCSS, or custom
          tooling.
        </p>
      </section>
      <section className='panel'>
        <pre>{`iconcat extract\n\nentries -> dependency graph -> icon catalog -> adapters`}</pre>
      </section>
      <section className='home-links'>
        <Link className='button' href='/docs/app'>
          Next.js App Router
        </Link>
        <Link className='button secondary' href='/docs/pages'>
          Next.js Pages Router
        </Link>
        <Link className='button secondary' href='/docs/react-router'>
          React Router
        </Link>
      </section>
    </main>
  )
}
