import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'
import { HomePanel } from '@iconcat/example-fixtures/home'
import { SettingsPanel } from '@iconcat/example-fixtures/settings'
import { defineIconcatIcons } from 'iconcat/runtime'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { renderRouteLink } from './route-link'

const dashboardConfigurableIcons = defineIconcatIcons([
  'mdi-light:chart-line',
  'mdi-light:calendar',
])

const isDevelopment = import.meta.env.DEV
const demoIconClasses = [
  'icon-[line-md--loading-loop]',
  'icon-[mdi-light--calendar]',
  'icon-[mdi-light--chart-line]',
  'icon-[mdi-light--cog]',
  'icon-[mdi-light--home]',
  'icon-[mdi-light--view-dashboard]',
]

const meta = {
  appType: 'React Router / Vite',
  routerType: 'React Router',
  cssHref: isDevelopment ? undefined : window.__ICONCAT_CSS_HREF__,
  cssFiles: isDevelopment
    ? [
        {
          href: 'dev server injected CSS',
          label: 'Tailwind dynamic icon selectors',
          source: 'dev' as const,
        },
      ]
    : [
        {
          href: window.__ICONCAT_CSS_HREF__,
          label: 'SPA app icons',
          source: 'global' as const,
        },
      ],
  cssTarget: 'dist/assets/iconcat.[hash].css',
  cssLoading: isDevelopment
    ? 'development: Tailwind dynamic icon selectors from the Vite dev server; catalog CSS is not linked'
    : 'page manifest preview: SPA app CSS linked by Vite plugin',
  catalogMode: `page icon CSS mode, ${dashboardConfigurableIcons.length} configurable icons`,
  configurableIconItems: [
    {
      className: 'icon-[mdi-light--chart-line]',
      icon: 'mdi-light:chart-line',
      label: 'Configurable chart',
    },
    {
      className: 'icon-[mdi-light--calendar]',
      icon: 'mdi-light:calendar',
      label: 'Configurable calendar',
    },
  ],
  devIconClasses: isDevelopment ? demoIconClasses : [],
  globalIconClasses: isDevelopment ? [] : demoIconClasses,
  observability: [
    'React Router preview uses src/App.tsx as a global scoped SPA entry so Vite can link one app CSS file.',
    'Route-level lazy page CSS is intentionally left for the later per-route injection adapter.',
    'The same catalog still records page-mode manifest shape and hashed CSS output.',
  ],
  pageIconClasses: [],
  previewLabel: isDevelopment ? 'development preview' : 'production preview',
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePanel meta={meta} routeLink={renderRouteLink} />,
  },
  {
    path: '/dashboard',
    element: <DashboardPanel meta={meta} routeLink={renderRouteLink} />,
  },
  {
    path: '/settings',
    element: <SettingsPanel meta={meta} routeLink={renderRouteLink} />,
  },
])

export function App() {
  return <RouterProvider router={router} />
}
