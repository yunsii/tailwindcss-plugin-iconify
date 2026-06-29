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

const iconLibraries = [
  {
    icons: [
      'icon-[mdi--rocket]',
      'icon-[mdi--sitemap]',
      'icon-[mdi--database]',
      'icon-[mdi--layers]',
      'icon-[mdi--github]',
      'icon-[mdi--cloud]',
    ],
    name: 'Material Design Icons',
    prefix: 'mdi',
  },
  {
    icons: [
      'icon-[line-md--home]',
      'icon-[line-md--search]',
      'icon-[line-md--cloud]',
      'icon-[line-md--github]',
      'icon-[line-md--download]',
      'icon-[line-md--speedometer]',
    ],
    name: 'Line MD',
    prefix: 'line-md',
  },
  {
    icons: [
      'icon-[svg-spinners--3-dots-bounce]',
      'icon-[svg-spinners--bars-scale]',
      'icon-[svg-spinners--pulse-rings-3]',
      'icon-[svg-spinners--wifi]',
      'icon-[svg-spinners--clock]',
      'icon-[svg-spinners--blocks-wave]',
    ],
    name: 'SVG Spinners',
    prefix: 'svg-spinners',
  },
]

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
          url: '/docs/concepts/framework-loading',
        },
        {
          text: 'API',
          url: '/docs/reference/iconcat-tailwind-api-migration',
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
            <Link className='button secondary' href='/docs/concepts/framework-loading'>
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

      <section className='icon-library-section' aria-labelledby='icon-library-heading'>
        <div className='icon-library-copy'>
          <p className='eyebrow'>Iconify libraries</p>
          <h2 id='icon-library-heading'>Render many icon sets as CSS.</h2>
          <p>
            Iconcat keeps the library prefix in the class name, extracts only the
            icons reachable from source, and emits the final CSS artifact for the
            framework adapter.
          </p>
        </div>
        <div className='icon-library-grid'>
          {iconLibraries.map((library) => (
            <section className='icon-library-panel' key={library.prefix}>
              <div className='icon-library-card-head'>
                <span>{library.name}</span>
                <code>{library.prefix}</code>
              </div>
              <div className='icon-showcase' aria-hidden='true'>
                {library.icons.map((icon) => (
                  <span className='icon-showcase-cell' key={icon}>
                    <span className={icon} />
                  </span>
                ))}
              </div>
            </section>
          ))}
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
            href='/docs/frameworks/next-app-router'
            title='Next.js App Router'
            description='Automatic route entry discovery with layout-aware page CSS.'
          />
          <Card
            href='/docs/frameworks/next-pages-router'
            title='Next.js Pages Router'
            description='Document head injection, SSG, and SSR page-mode examples.'
          />
          <Card
            href='/docs/frameworks/react-router-vite'
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
