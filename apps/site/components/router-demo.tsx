import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import Link from 'next/link'

import { routerDemos } from '../lib/router-demos'
import { DocShell } from './doc-shell'

import type { RouterDemoKey } from '../lib/router-demos'

export function RouterDemo({ name }: { name: RouterDemoKey }) {
  const demo = routerDemos[name]
  const catalog = readCatalog(demo.catalogPath)

  return (
    <DocShell active={name}>
      <p className='eyebrow'>Framework preset</p>
      <h1>{demo.title}</h1>
      <p className='lead'>
        Iconcat starts from this router&apos;s framework entries, follows the
        dependency graph, walks shared chunks, and writes a focused icon
        catalog for adapters.
      </p>
      <p>
        In development, the demo keeps Tailwind&apos;s dynamic icon path for fast
        feedback. During production builds, Iconcat runs as a build-time side
        task through a CLI step or bundler plugin. SSR only loads the generated
        catalog or adapter output; it never scans source during requests.
      </p>

      <div className='action-row'>
        <a className='button' href={demo.previewUrl}>
          Open live example
        </a>
        <Link className='button secondary' href='/docs'>
          Back to docs
        </Link>
      </div>

      <section className='grid-two'>
        <div className='panel'>
          <h2>Entries</h2>
          <ul className='code-list'>
            {demo.entries.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
        <div className='panel'>
          <h2>Extract command</h2>
          <pre>{demo.command}</pre>
        </div>
      </section>

      <section className='panel'>
        <h2>Production build path</h2>
        <pre>{demo.buildCommand}</pre>
      </section>

      <section className='panel'>
        <h2>Extracted catalog</h2>
        <pre>{JSON.stringify(catalog.icons, null, 2)}</pre>
      </section>

      <section className='panel'>
        <h2>Per-entry catalog</h2>
        <pre>{JSON.stringify(catalog.entries, null, 2)}</pre>
      </section>
    </DocShell>
  )
}

function readCatalog(path: string) {
  const file = resolve(process.cwd(), '../..', path)
  return JSON.parse(readFileSync(file, 'utf8')) as {
    icons: Record<string, string[]>
    entries: Record<string, unknown>
  }
}
