import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'
import { HomePanel } from '@iconcat/example-fixtures/home'
import { defineIconcatIcons } from 'iconcat/runtime'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const dashboardConfigurableIcons = defineIconcatIcons([
  'mdi-light:chart-line',
  'mdi-light:calendar',
])

const meta = {
  appType: 'React Router / Vite',
  routerType: 'React Router',
  cssHref: window.__ICONCAT_CSS_HREF__,
  cssTarget: 'dist/assets/iconcat.[hash].css',
  cssLoading: 'global stylesheet links from Vite plugin',
  catalogMode: `${dashboardConfigurableIcons.length} configurable icons`,
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePanel meta={meta} />,
  },
  {
    path: '/dashboard',
    element: <DashboardPanel meta={meta} />,
  },
])

export function App() {
  return <RouterProvider router={router} />
}
