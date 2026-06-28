import type { ReactNode } from 'react'

import { navigationItems, sharedIconUsage } from './navigation'

export interface DemoIconItem {
  className: string
  href?: string
  icon: string
  label: string
}

export type DemoIconSource = 'dev' | 'global' | 'main' | 'page' | 'unmapped'

export interface DemoCSSFile {
  href?: string
  label: string
  source: DemoIconSource
}

export interface DemoMeta {
  appType: string
  routerType: string
  cssHref?: string
  cssFiles?: DemoCSSFile[]
  cssTarget: string
  cssLoading: string
  catalogMode?: string
  configurableIconItems?: DemoIconItem[]
  devIconClasses?: string[]
  globalIconClasses?: string[]
  mainIconClasses?: string[]
  observability?: string[]
  pageIconClasses?: string[]
  previewLabel?: string
}

export type RouteLinkRenderer = (item: { href: string, label: string }) => ReactNode

export function DashboardShell({
  active,
  children,
  meta,
  routeLink,
}: {
  active: string
  children?: ReactNode
  meta: DemoMeta
  routeLink?: RouteLinkRenderer
}) {
  const activeItem = navigationItems.find((item) => item.href === routeFor(active))
  const pageIcons = activeItem ? [activeItem, ...sharedIconUsage] : sharedIconUsage
  const cssFiles = meta.cssFiles || [
    {
      href: meta.cssHref,
      label: 'Injected CSS',
      source: 'unmapped',
    },
  ]

  return (
    <main>
      <style>
        {`
          main { color: #123c35; font-family: system-ui, sans-serif; padding: 32px; }
          .demo-layout { display: grid; gap: 24px; max-width: 880px; }
          .hero { display: grid; gap: 12px; }
          h1 { margin: 0; text-transform: capitalize; }
          p { margin: 0; color: #52625e; }
          .meta-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
          .panel { border: 1px solid #cbd4cf; border-radius: 8px; padding: 16px; }
          .label { color: #52625e; font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
          .value { margin-top: 6px; overflow-wrap: anywhere; font-size: 14px; }
          .demo-icon { display: inline-grid; place-items: center; width: 48px; height: 48px; border-radius: 8px; background: #123c35; color: white; font-weight: 700; }
          button { align-items: center; display: inline-flex; gap: 8px; width: max-content; border: 1px solid #cbd4cf; border-radius: 8px; background: white; color: #123c35; padding: 8px 12px; }
          ul { display: grid; gap: 8px; list-style: none; margin: 12px 0 0; padding: 0; }
          li { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
          a { color: #0f6f61; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
          a::after { content: " ->"; font-weight: 700; }
          code { background: #eef3f0; border-radius: 4px; color: #123c35; padding: 2px 5px; }
          .source { border-radius: 999px; color: white; font-size: 11px; font-weight: 800; line-height: 1; padding: 4px 7px; text-transform: uppercase; }
          .source-dev { background: #8a4b12; }
          .source-global { background: #0f6f61; }
          .source-main { background: #5a3fa1; }
          .source-page { background: #3155a4; }
          .source-unmapped { background: #6b6470; }
          .note-list { color: #52625e; font-size: 14px; line-height: 1.5; }
        `}
      </style>
      <div className='demo-layout'>
        <section className='hero'>
          <p className='label'>{meta.appType}</p>
          <h1>{active}</h1>
          <p>
            {meta.routerType}
            {' '}
            {meta.previewLabel || 'production preview'}
            {' '}
            with Iconcat catalog CSS.
          </p>
          <div>{children}</div>
          <IconButton label={active} />
        </section>
        <section className='meta-grid' aria-label='Iconcat build metadata'>
          <MetaPanel label='Router' value={meta.routerType} />
          <MetaPanel label='Catalog mode' value={meta.catalogMode || 'entry graph extraction'} />
          <MetaPanel label='Injected CSS' value={meta.cssHref || 'not linked'} />
          <MetaPanel label='CSS target' value={meta.cssTarget} />
          <MetaPanel label='CSS loading' value={meta.cssLoading} />
        </section>
        <section className='panel'>
          <p className='label'>Iconcat CSS files</p>
          <ul>
            {cssFiles.map((file) => (
              <li key={`${file.source}:${file.label}`}>
                <SourceBadge source={file.source} />
                <span>{file.label}</span>
                <code>{file.href || 'not linked'}</code>
              </li>
            ))}
          </ul>
        </section>
        <section className='panel'>
          <p className='label'>Current route icons</p>
          <IconList items={pageIcons} meta={meta} />
        </section>
        {meta.configurableIconItems?.length
          ? (
              <section className='panel'>
                <p className='label'>Configurable allowlist icons</p>
                <IconList items={meta.configurableIconItems} meta={meta} />
              </section>
            )
          : null}
        <section className='panel'>
          <p className='label'>Catalog-visible routes</p>
          <IconList items={navigationItems} meta={meta} routeLink={routeLink} />
        </section>
        {meta.observability?.length
          ? (
              <section className='panel'>
                <p className='label'>Observability notes</p>
                <ul className='note-list'>
                  {meta.observability.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )
          : null}
      </div>
    </main>
  )
}

export function IconButton({ label }: { label: string }) {
  return (
    <button type='button'>
      <span aria-hidden='true' className='icon-[line-md--loading-loop]' />
      {label}
    </button>
  )
}

function MetaPanel({ label, value }: { label: string, value: string }) {
  return (
    <div className='panel'>
      <p className='label'>{label}</p>
      <p className='value'>{value}</p>
    </div>
  )
}

function IconList({
  items,
  meta,
  routeLink,
}: {
  items: DemoIconItem[]
  meta: DemoMeta
  routeLink?: RouteLinkRenderer
}) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.icon}>
          <span aria-hidden='true' className={item.className} />
          <SourceBadge source={sourceForIcon(item.className, meta)} />
          {routeLink
            ? routeLink({ href: item.href || routeFor(item.label.toLowerCase()), label: item.label })
            : <span>{item.label}</span>}
          <code>{item.className}</code>
        </li>
      ))}
    </ul>
  )
}

function SourceBadge({ source }: { source: DemoCSSFile['source'] }) {
  return <span className={`source source-${source}`}>{source}</span>
}

function sourceForIcon(className: string, meta: DemoMeta): DemoCSSFile['source'] {
  if (meta.globalIconClasses?.includes(className)) {
    return 'global'
  }

  if (meta.pageIconClasses?.includes(className)) {
    return 'page'
  }

  if (meta.mainIconClasses?.includes(className)) {
    return 'main'
  }

  if (meta.devIconClasses?.includes(className)) {
    return 'dev'
  }

  return 'unmapped'
}

function routeFor(active: string) {
  return active === 'home' ? '/' : `/${active}`
}
