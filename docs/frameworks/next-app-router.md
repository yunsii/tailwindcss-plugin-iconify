---
title: Next.js App Router
description: Route-driven page CSS loading for Iconcat in Next.js App Router applications.
---

# Next.js App Router

Iconcat App Router integration uses route-driven page CSS loading. Application
code passes public route paths such as `/dashboard`, not source entries such as
`src/app/dashboard/page.tsx`.

```tsx
import { IconcatAppRouterPageStylesheets } from '@iconcat/next/app-router'

export default function DashboardPage() {
  return (
    <>
      <IconcatAppRouterPageStylesheets page='/dashboard' />
      {/* page content */}
    </>
  )
}
```

## Production Loading

In production, `IconcatAppRouterPageStylesheets` reads
`.iconcat/manifest.json`, resolves the route through `manifest.pageRoutes`, and
renders React stylesheet links with `precedence="next"`. React renders that as
`data-precedence`, which aligns Iconcat CSS with App Router's managed stylesheet
ordering model.

The helper is fail-fast. If the route is not present in `manifest.pageRoutes`,
server rendering or `next build` throws instead of silently omitting the icon
stylesheet.

## Route Resolution

The generated manifest keeps source entries as internal artifact keys:

```json
{
  "pageRoutes": {
    "/dashboard": "src/app/dashboard/page.tsx"
  },
  "routes": {
    "src/app/dashboard/page.tsx": [
      "src/app/layout.tsx",
      "src/app/dashboard/page.tsx"
    ]
  }
}
```

Route groups, parallel slots, and intercepted routes are normalized to public
URLs when generating `pageRoutes`. If a main page and a parallel slot page share
the same URL, Iconcat keeps the main page as the public route alias.

## Development

Development mode does not need page CSS extraction on every route interaction.
The example app keeps Tailwind dynamic icon selectors active in development and
uses Iconcat page-mode extraction for production builds.

See [framework loading](../concepts/framework-loading.md) for the full App Router loading
model and [catalog extraction flow](../concepts/iconcat-flow.md) for the end-to-end build
pipeline.
