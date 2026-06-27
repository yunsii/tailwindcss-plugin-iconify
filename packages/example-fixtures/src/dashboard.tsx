import type { ReactNode } from 'react'

import { navigationItems, sharedIconUsage } from './navigation'

export interface DemoMeta {
  appType: string
  routerType: string
  cssHref?: string
  cssTarget: string
  cssLoading: string
  catalogMode?: string
}

export function DashboardShell({
  active,
  children,
  meta,
}: {
  active: string
  children?: ReactNode
  meta: DemoMeta
}) {
  const activeItem = navigationItems.find((item) => item.href === routeFor(active))
  const pageIcons = activeItem ? [activeItem, ...sharedIconUsage] : sharedIconUsage

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
          li { align-items: center; display: flex; gap: 10px; }
          code { background: #eef3f0; border-radius: 4px; color: #123c35; padding: 2px 5px; }
        `}
      </style>
      <div className='demo-layout'>
        <section className='hero'>
          <p className='label'>{meta.appType}</p>
          <h1>{active}</h1>
          <p>
            {meta.routerType}
            {' '}
            production preview with Iconcat catalog CSS.
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
          <p className='label'>Current route icons</p>
          <IconList items={pageIcons} />
        </section>
        <section className='panel'>
          <p className='label'>Catalog-visible routes</p>
          <IconList items={navigationItems} />
        </section>
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
}: {
  items: Array<{ label: string, icon: string, className: string }>
}) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.icon}>
          <span aria-hidden='true' className={item.className} />
          <span>{item.label}</span>
          <code>{item.className}</code>
        </li>
      ))}
    </ul>
  )
}

function routeFor(active: string) {
  return active === 'home' ? '/' : `/${active}`
}
