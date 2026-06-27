import Link from 'next/link'

import { DocShell } from '../../components/doc-shell'
import { routerDemos } from '../../lib/router-demos'

const artifactTree = [
  'app build',
  '├─ Tailwind main CSS',
  '│  └─ app utilities, layout, and component styles',
  '├─ framework static output',
  '│  ├─ Next.js: .next/static/css/iconcat.[hash].css',
  '│  └─ Vite: dist/assets/iconcat.[hash].css',
  '├─ .iconcat/iconcat.[hash].css',
  '│  └─ catalog-limited icon-[set--name] selectors',
  '├─ .iconcat/manifest.json',
  '│  └─ maps the current icon CSS href',
  '└─ .iconcat/catalog.json',
  '   └─ normalized icons and per-entry metadata',
].join('\n')

export default function DocsPage() {
  return (
    <DocShell>
      <h1>Docs</h1>
      <p className='lead'>
        Iconcat mirrors Lingui&apos;s catalog extraction model for icons:
        start with framework entries, traverse the dependency graph, and write a
        catalog that Tailwind, UnoCSS, or custom tooling can consume.
      </p>
      <div className='grid-three'>
        {Object.entries(routerDemos).map(([key, demo]) => (
          <Link className='panel link-panel' href={demo.href} key={key}>
            <h2>{demo.title}</h2>
            <p>{demo.examplePath}</p>
          </Link>
        ))}
      </div>
      <div className='panel'>
        <h2>Concept</h2>
        <p>
          The extractor does not scan the entire repository. It asks a bundler
          for the reachable module graph, walks entry chunks and shared chunks,
          then extracts static icon references into a normalized catalog.
        </p>
      </div>
      <section className='panel'>
        <h2>Build Flow</h2>
        <div className='flow'>
          <div className='flow-node'>Framework entries</div>
          <div className='flow-arrow'>→</div>
          <div className='flow-node'>Dependency graph</div>
          <div className='flow-arrow'>→</div>
          <div className='flow-node'>Icon scan</div>
          <div className='flow-arrow'>→</div>
          <div className='flow-node'>Catalog</div>
          <div className='flow-arrow'>→</div>
          <div className='flow-node accent'>iconcat.[hash].css</div>
        </div>
        <p>
          Production builds emit a separate icon stylesheet from the catalog.
          Tailwind keeps the application stylesheet focused on normal utilities.
        </p>
      </section>
      <section className='grid-two'>
        <div className='panel'>
          <h2>Development</h2>
          <ol className='flow-list'>
            <li>Tailwind scans source files.</li>
            <li>The dynamic icon plugin responds to icon classes.</li>
            <li>Feedback stays immediate without catalog extraction.</li>
          </ol>
        </div>
        <div className='panel'>
          <h2>Production</h2>
          <ol className='flow-list'>
            <li>Iconcat extracts the reachable icon catalog.</li>
            <li>
              The Tailwind adapter writes
              {' '}
              <code>.iconcat/iconcat.[hash].css</code>
              .
            </li>
            <li>
              The app links
              {' '}
              <code>{'<framework-assets>/iconcat.[hash].css'}</code>
              {' '}
              from the manifest at runtime.
            </li>
          </ol>
        </div>
      </section>
      <section className='panel'>
        <h2>Build Order</h2>
        <p>
          Production builds run extraction before the framework reads
          {' '}
          <code>.iconcat/manifest.json</code>
          . Next.js demos install the CSS into
          {' '}
          <code>.next/static/css</code>
          ; the Vite demo emits it into
          {' '}
          <code>dist/assets</code>
          .
        </p>
      </section>
      <section className='panel'>
        <h2>CSS Injection</h2>
        <p>
          Iconcat writes a standalone hashed stylesheet instead of merging icon
          rules into the Tailwind output. Each framework links that asset in the
          way its production build expects.
        </p>
        <div className='strategy-grid'>
          <div>
            <h3>App Router</h3>
            <p>
              Reads the manifest during server render and emits a React
              stylesheet link with
              {' '}
              <code>precedence=&quot;next&quot;</code>
              . React renders it as
              {' '}
              <code>data-precedence</code>
              , matching Next&apos;s managed stylesheet model.
            </p>
          </div>
          <div>
            <h3>Pages Router</h3>
            <p>
              Reads the manifest in
              {' '}
              <code>_document</code>
              {' '}
              and emits both a CSS preload hint and a stylesheet link, matching
              the legacy Pages Router CSS loading shape.
            </p>
          </div>
          <div>
            <h3>React Router</h3>
            <p>
              Lets Vite emit
              {' '}
              <code>assets/iconcat.[hash].css</code>
              {' '}
              and injects the stylesheet link into the production
              {' '}
              <code>index.html</code>
              .
            </p>
          </div>
        </div>
        <p>
          App Router does not need an extra
          {' '}
          <code>{'<link rel="preload" as="style">'}</code>
          {' '}
          for iconcat. The stylesheet link is the applying resource, and
          {' '}
          <code>precedence</code>
          {' '}
          opts into React&apos;s stylesheet ordering and dedupe behavior.
        </p>
      </section>
      <section className='panel'>
        <h2>Artifacts</h2>
        <pre>{artifactTree}</pre>
      </section>
    </DocShell>
  )
}
