---
title: Next.js Pages Router
description: Global and page-level Iconcat CSS integration for Next.js Pages Router applications.
---

# Next.js Pages Router

Iconcat Pages Router integration splits global shell icon CSS from page-level
icon CSS. Root `_app.*` entries are auto-promoted to the global icon CSS layer,
while individual pages load route-scoped CSS from SSG or SSR props.

## Global CSS In `_document`

Wrap `next/document`'s `Head` with `createIconcatDocumentHead`:

```tsx
import { createIconcatDocumentHead } from '@iconcat/next/pages-router'
import Document, { Head, Html, Main, NextScript } from 'next/document'

const IconcatHead = createIconcatDocumentHead(Head)

export default class AppDocument extends Document {
  render() {
    return (
      <Html>
        <IconcatHead />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
```

The wrapped head keeps Next's original CSS links, preloads priority Iconcat CSS,
and appends stylesheet links for globally loaded Iconcat CSS files.

## Page CSS In Data Methods

Use route paths with `getIconcatPageCSSFiles`; source entries are not accepted.

```ts
import { getIconcatPageCSSFiles } from '@iconcat/next'

export function getStaticProps() {
  return {
    props: {
      iconcatPageCSSFiles: getIconcatPageCSSFiles('/dashboard'),
    },
  }
}
```

The same pattern works in `getServerSideProps`:

```ts
export function getServerSideProps() {
  return {
    props: {
      iconcatPageCSSFiles: getIconcatPageCSSFiles('/settings'),
    },
  }
}
```

If the route is missing from `manifest.pageRoutes`, Iconcat throws during SSG or
SSR so stale manifests and invalid route declarations do not silently ship
missing icon styles.

See [framework loading](/docs/concepts/framework-loading) for link ordering details and
[catalog extraction flow](/docs/concepts/iconcat-flow) for the page-mode artifact model.
