import { DashboardPanel } from '@iconcat/example-fixtures/dashboard-panel'
import { HomePanel } from '@iconcat/example-fixtures/home'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const meta = {
  appType: 'React Router / Vite',
  routerType: 'React Router',
  cssHref: window.__ICONCAT_CSS_HREF__,
  cssTarget: 'dist/assets/iconcat.[hash].css',
  cssLoading: 'stylesheet link',
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
