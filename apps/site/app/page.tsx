import { Card, Cards } from 'fumadocs-ui/components/card'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import Link from 'next/link'

const extractPreview = [
  'iconcat extract',
  '',
  'entries: 5',
  'modules: 42',
  'icons: 18',
  '',
  'write .iconcat/catalog.json',
  'emit iconcat.83f2a4.css',
].join('\n')

export default function HomePage() {
  return (
    <HomeLayout
      className='home-shell'
      githubUrl='https://github.com/yunsii/tailwindcss-plugin-iconify'
      nav={{
        title: <BrandMark />,
        transparentMode: 'top',
      }}
      links={[
        {
          text: 'Docs',
          url: '/docs',
          active: 'nested-url',
        },
        {
          text: 'Frameworks',
          url: '/docs/framework-loading',
        },
        {
          text: 'API',
          url: '/docs/iconcat-tailwind-api-migration',
        },
      ]}
    >
      <section className='hero'>
        <div className='hero-copy'>
          <p className='eyebrow'>Icon catalog extraction for modern routers</p>
          <h1 className='hero-title'>
            <span>Iconcat</span>
            <span>
              extracts
              <em>icon CSS</em>
            </span>
            <span>from reachable routes.</span>
          </h1>
          <p>
            Entry-driven dependency graph extraction for Tailwind icon catalogs,
            page-mode CSS, and framework adapters that stay observable in
            production builds.
          </p>
          <div className='action-row'>
            <Link className='button' href='/docs'>
              Read the docs
            </Link>
            <Link className='button secondary' href='/docs/framework-loading'>
              Framework loading
            </Link>
          </div>
        </div>
        <div className='hero-preview' aria-label='Iconcat extraction flow'>
          <div className='terminal-top'>
            <span />
            <span />
            <span />
          </div>
          <pre>{extractPreview}</pre>
          <div className='artifact-row'>
            <span>priority CSS</span>
            <span>page CSS</span>
            <span>manifest</span>
          </div>
        </div>
      </section>

      <section className='home-cards' aria-label='Iconcat documentation links'>
        <Cards className='home-card-grid'>
          <Card
            title='Dependency-tree catalog'
            description='Follows reachable source from framework entries.'
          />
          <Card
            title='Hashed CSS artifacts'
            description='Stable files for production injection and cache reuse.'
          />
          <Card
            title='Framework adapters'
            description='Next App Router, Pages Router, and React Router/Vite.'
          />
        </Cards>
        <Cards className='home-card-grid'>
          <Card
            href='/docs/next-app-router'
            title='Next.js App Router'
            description='Automatic route entry discovery with layout-aware page CSS.'
          />
          <Card
            href='/docs/next-pages-router'
            title='Next.js Pages Router'
            description='Document head injection, SSG, and SSR page-mode examples.'
          />
          <Card
            href='/docs/react-router-vite'
            title='React Router on Vite'
            description='Build-time extraction and runtime page stylesheet loading.'
          />
        </Cards>
      </section>
    </HomeLayout>
  )
}

function BrandMark() {
  return (
    <span className='brand-mark'>
      <span className='brand-glyph'>IC</span>
      <span>Iconcat</span>
    </span>
  )
}
